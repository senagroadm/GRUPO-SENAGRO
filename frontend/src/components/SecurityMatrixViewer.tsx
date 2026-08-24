'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, Key, Clock, Upload, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { ENVIRONMENT_CONFIGS, Environment } from '@/backend/config/environments';
import { validatePassword } from '@/backend/core/security/password-policy';
import { maskSensitiveData } from '@/backend/core/security/masking';
import { mfaService } from '@/backend/core/security/mfa';

export function SecurityMatrixViewer() {
  const [selectedEnv, setSelectedEnv] = useState<Environment>('production');
  const [testPassword, setTestPassword] = useState('Nexus@Industrial2026#Secure');
  const [testMfaRole, setTestMfaRole] = useState('SUPERADMIN');
  const [testMfaCode, setTestMfaCode] = useState('123456');
  const [mfaValidationResult, setMfaValidationResult] = useState<{ success: boolean; message?: string } | null>(null);

  const envConfig = ENVIRONMENT_CONFIGS[selectedEnv];
  const passwordEvaluation = validatePassword(testPassword, selectedEnv);

  const sampleSensitiveLog = {
    userId: 'usr-admin-8821',
    password: 'Secret123456!',
    userCpf: '12345678901',
    companyCnpj: '44566045000101',
    databaseUrl: 'postgresql://db_master:SuperSecretPass@10.0.0.15:5432/nexus_erp',
    jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  };

  const maskedLog = maskSensitiveData(sampleSensitiveLog);

  const handleTestMfa = async () => {
    const res = await mfaService.verifyToken('usr-demo', 'secret-key', testMfaCode);
    setMfaValidationResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Environment Selector Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Configuração e Políticas de Segurança por Ambiente
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Alternância de perfis de segurança: DEV (depuração), STAGING (homologação) e PROD (alta segurança).
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['development', 'staging', 'production'] as Environment[]).map((env) => (
            <button
              key={env}
              onClick={() => setSelectedEnv(env)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider transition-all ${
                selectedEnv === env
                  ? env === 'production'
                    ? 'bg-red-600 text-white shadow-xs'
                    : env === 'staging'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Security Controls for Selected Environment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CORS & Headers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              CORS & Headers HTTP
            </span>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              OWASP Top 10
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">HSTS / CSP:</span>
              <span className="font-semibold text-slate-800">
                {envConfig.isProduction || selectedEnv === 'staging' ? 'Ativo (Estrito)' : 'Permissivo (Dev)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">X-Frame-Options:</span>
              <span className="font-mono font-semibold text-slate-800">DENY</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">X-Content-Type:</span>
              <span className="font-mono font-semibold text-slate-800">nosniff</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Origens CORS Permitidas:</span>
              <div className="bg-slate-50 p-2 rounded text-[10px] font-mono text-slate-700 border border-slate-200 space-y-0.5">
                {envConfig.cors.allowedOrigins.map((origin) => (
                  <div key={origin} className="truncate">• {origin}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting & Timeouts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Rate Limit & Proteção Anti-DDoS
            </span>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
              Per IP Bucket
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Limite Geral API:</span>
              <span className="font-semibold text-slate-800">{envConfig.rateLimit.maxRequests} req / min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Limite Auth / Login:</span>
              <span className="font-semibold text-red-600">{envConfig.rateLimit.authMaxRequests} req / min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Timeout Máximo:</span>
              <span className="font-semibold text-slate-800">{envConfig.requestTimeoutMs / 1000} segundos</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Limite de Upload:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Upload className="w-3 h-3 text-slate-400" />
                {envConfig.maxUploadSizeBytes / (1024 * 1024)} MB
              </span>
            </div>
          </div>
        </div>

        {/* Password Policy & MFA Policy */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-purple-600" />
              Política de Senhas & MFA
            </span>
            <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
              Zero-Trust
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Comprimento Mínimo:</span>
              <span className="font-semibold text-slate-800">{envConfig.passwordPolicy.minLength} caracteres</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Complexidade:</span>
              <span className="font-semibold text-slate-800">
                {envConfig.passwordPolicy.requireSpecialChars ? 'Maiúsc + Minúsc + Núm + Símbolo' : 'Básica'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">MFA Obrigatório:</span>
              <span className={`font-semibold ${envConfig.mfa.enforceForCriticalRoles ? 'text-emerald-700' : 'text-slate-500'}`}>
                {envConfig.mfa.enforceForCriticalRoles ? 'Sim (Perfis Críticos)' : 'Opcional em Dev'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Stack Traces em Erros:</span>
              <span className={`font-semibold ${envConfig.logging.exposeStackTraces ? 'text-amber-600' : 'text-emerald-600'}`}>
                {envConfig.logging.exposeStackTraces ? 'Visível (Dev)' : 'Oculto (Seguro)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Security Demonstrator: Password Validator & Log Masker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        {/* Interactive Password Policy Tester */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              Simulador de Validação de Política de Senha
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              passwordEvaluation.valid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              Score: {passwordEvaluation.score}/100 — {passwordEvaluation.valid ? 'Em Conformidade' : 'Não Conforme'}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-slate-600 font-semibold">Testar Senha contra o perfil ({selectedEnv}):</label>
            <input
              type="text"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Digite uma senha para validar..."
            />

            {passwordEvaluation.errors.length > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 space-y-1">
                <div className="text-[11px] font-bold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Restrições não atendidas:
                </div>
                <ul className="list-disc list-inside text-[10px] text-red-700 space-y-0.5">
                  {passwordEvaluation.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2 text-emerald-800 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Senha aprovada para o ambiente <strong>{selectedEnv.toUpperCase()}</strong> com entropia segura.
              </div>
            )}
          </div>
        </div>

        {/* Interactive Log Masking Inspector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              Mascaramento Automático de Dados Sensíveis (LGPD)
            </span>
            <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
              Sanitização Ativa
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Qualquer log estruturado emitido pelo sistema filtra senhas, CPFs, CNPJs e tokens automaticamente:
          </p>

          <div className="bg-slate-900 p-3 rounded-lg font-mono text-[10px] text-emerald-400 overflow-x-auto">
            <pre>{JSON.stringify(maskedLog, null, 2)}</pre>
          </div>
        </div>
      </div>

      {/* MFA Extension Point Tester */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Ponto de Extensão MFA (Multi-Factor Authentication)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Preparado para provedores TOTP (Google Authenticator / Authy) e Hardware Keys FIDO2.
            </p>
          </div>

          <div className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
            MFA para {testMfaRole}: {mfaService.isMfaRequiredForRole(testMfaRole, selectedEnv) ? 'OBRIGATÓRIO' : 'OPCIONAL'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Papel de Acesso:</label>
            <select
              value={testMfaRole}
              onChange={(e) => setTestMfaRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="SUPERADMIN">SUPERADMIN (Crítico)</option>
              <option value="DIRETOR_FINANCEIRO">DIRETOR_FINANCEIRO (Crítico)</option>
              <option value="RESPONSAVEL_FISCAL">RESPONSAVEL_FISCAL (Crítico)</option>
              <option value="OPERADOR_FABRICA">OPERADOR_FABRICA (Padrão)</option>
              <option value="VENDEDOR">VENDEDOR (Padrão)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Código TOTP (6 dígitos):</label>
            <input
              type="text"
              value={testMfaCode}
              maxLength={6}
              onChange={(e) => setTestMfaCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ex: 123456"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestMfa}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors shadow-xs"
            >
              Validar Token MFA
            </button>
          </div>
        </div>

        {mfaValidationResult && (
          <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
            mfaValidationResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {mfaValidationResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{mfaValidationResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
