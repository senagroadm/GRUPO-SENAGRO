'use client';

import React, { useState } from 'react';
import { Empresa, EMPRESAS_GRUPO } from '../../../backend/core/types/company';
import { UserRole } from '../../../app/page';
import {
  Building2,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  Fingerprint,
} from 'lucide-react';

interface LoginViewerProps {
  onLoginSuccess: (user: {
    email: string;
    role: UserRole;
    empresa: Empresa;
    nome: string;
  }) => void;
}

export function LoginViewer({ onLoginSuccess }: LoginViewerProps) {
  const [email, setEmail] = useState('dgdiniz99@gmail.com');
  const [password, setPassword] = useState('Admin@123456');
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>(EMPRESAS_GRUPO[0].id);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleQuickPreset = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setEmail('dgdiniz99@gmail.com');
      setPassword('Admin@123456');
      setSelectedEmpresaId(EMPRESAS_GRUPO[0].id);
    } else {
      setEmail('operacao@tritech.ind.br');
      setPassword('Colab@123456');
      setSelectedEmpresaId(EMPRESAS_GRUPO[0].id);
    }
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email || !password) {
      setErrorMessage('Por favor, informe e-mail e senha.');
      return;
    }

    setIsLoading(true);

    // Simulação de verificação de credenciais e MFA/RLS seguro
    setTimeout(() => {
      setIsLoading(false);
      const empresa = EMPRESAS_GRUPO.find((emp) => emp.id === selectedEmpresaId) || EMPRESAS_GRUPO[0];
      
      const nome =
        selectedRole === 'ADMIN'
          ? 'Administrador Principal'
          : 'Colaborador Operacional';

      setSuccessNotice('Autenticação autorizada! Carregando contexto empresarial...');

      setTimeout(() => {
        onLoginSuccess({
          email,
          role: selectedRole,
          empresa,
          nome,
        });
      }, 500);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorativo Geométrico e Suave */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container Central de Login */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/25 mb-3 text-white">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            GRUPO SENAGRO
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma Integrada de Gestão Industrial e Comercial
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-7 shadow-2xl">
          {/* Presets Rápidos de Acesso */}
          <div className="mb-6 bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
              <span>Selecione Perfil de Demonstração</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-preset-admin"
                onClick={() => handleQuickPreset('ADMIN')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Super Admin
              </button>
              <button
                type="button"
                id="btn-preset-colab"
                onClick={() => handleQuickPreset('COLABORADOR')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'COLABORADOR'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                Colaborador
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Notificação de Sucesso */}
            {successNotice && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Campo: E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@senagro.com.br"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Campo: Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={() => alert('Para redefinir, contate o administrador de infraestrutura do Grupo SENAGRO.')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer font-semibold"
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo: Empresa de Login (Multi-tenant) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Unidade Empresarial
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="login-empresa-select"
                  value={selectedEmpresaId}
                  onChange={(e) => setSelectedEmpresaId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
                >
                  {EMPRESAS_GRUPO.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                      {emp.nomeFantasia} ({emp.codigo}) — {emp.cnpj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lembrar-me e Indicadores de Segurança */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-400">Permanecer conectado</span>
              </label>

              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Sessão Criptografada
              </span>
            </div>

            {/* Botão Principal de Login */}
            <button
              type="submit"
              id="btn-submit-login"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validando credenciais...</span>
              ) : (
                <>
                  <span>Acessar Painel Integrado</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé de Políticas & Governança */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Isolamento RLS por CNPJ
            </span>
            <span>SENAGRO v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
