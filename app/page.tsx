'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Database,
  Layers,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Factory,
  Hammer,
  Truck,
  DollarSign,
  Users,
  BarChart3,
  Search,
  ArrowRight,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Workflow,
  Sparkles,
  ChevronRight,
  KeyRound,
  FileCheck,
  ShieldAlert,
  Server,
  Code2,
  Check,
  ArrowRightLeft,
  Crown,
  Target,
  FolderLock,
} from 'lucide-react';
import { EMPRESAS_GRUPO, Empresa } from '../backend/core/types/company';
import { MODULOS_ERP, ModuloDefinition } from '../backend/modules/registry';
import { ModuloSistema, AcaoPermissao } from '../backend/core/types/permissions';
import { hasPermission, RequestTenantContext } from '../backend/core/types/context';
import { HealthStatusCard } from '../frontend/src/components/HealthStatusCard';
import { ApiInspector } from '../frontend/src/components/ApiInspector';
import { SecurityMatrixViewer } from '../frontend/src/components/SecurityMatrixViewer';
import { CompanyManagementViewer } from '../frontend/src/components/CompanyManagementViewer';
import { UserManagementViewer } from '../frontend/src/components/UserManagementViewer';
import { MultiTenantTestingViewer } from '../frontend/src/components/MultiTenantTestingViewer';
import { FileManagementViewer } from '../frontend/src/components/FileManagementViewer';
import { CrmViewer } from '../frontend/src/components/CrmViewer';
import { OrcamentoViewer } from '../frontend/src/components/OrcamentoViewer';
import { CreditoViewer } from '../frontend/src/components/CreditoViewer';
import { EmpresaRecord } from '../backend/modules/multi-tenant/types';

export default function ArchitectureDashboard() {
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa>(EMPRESAS_GRUPO[0]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orcamentos' | 'credito' | 'crm' | 'arquivos' | 'empresas' | 'empresas_crud' | 'usuarios_crud' | 'isolation_tests' | 'modulos' | 'database' | 'adr' | 'rbac_sim' | 'skeleton' | 'security'
  >('overview');
  const [selectedModule, setSelectedModule] = useState<ModuloDefinition | null>(MODULOS_ERP[0]);
  const [filterCategory, setFilterCategory] = useState<string>('TODOS');
  const [searchModule, setSearchModule] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('u1111111-1111-1111-1111-111111111111');
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);
  const [authorizedCompanies, setAuthorizedCompanies] = useState<EmpresaRecord[]>([]);
  const [switching, setSwitching] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  // RBAC Simulator State
  const [simRole, setSimRole] = useState<'SUPERADMIN' | 'GERENTE_PCP_TRITECH' | 'ORCAMENTISTA_MWAM' | 'CONTADOR_GRUPO' | 'OPERADOR_LASER'>('GERENTE_PCP_TRITECH');

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const res = await fetch(`/api/v1/auth/session?userId=${currentUserId}`);
        const data = await res.json();
        if (!ignore && data.success && data.data) {
          setCurrentUserInfo(data.data);
          setAuthorizedCompanies(data.data.authorizedCompanies || []);
          if (data.data.activeCompany) {
            const matched = EMPRESAS_GRUPO.find((e) => e.id === data.data.activeCompany.id) || {
              id: data.data.activeCompany.id,
              codigo: data.data.activeCompany.codigo,
              razaoSocial: data.data.activeCompany.razaoSocial,
              nomeFantasia: data.data.activeCompany.nomeFantasia,
              cnpj: data.data.activeCompany.cnpj,
              inscricaoEstadual: data.data.activeCompany.inscricaoEstadual,
              inscricaoMunicipal: data.data.activeCompany.inscricaoMunicipal,
              regimeTributario: data.data.activeCompany.regimeTributario as any,
              ramoAtividade: data.data.activeCompany.ramoAtividade,
              isActive: data.data.activeCompany.ativo !== false,
            };
            setEmpresaAtiva(matched);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar sessão multiempresa:', err);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, [currentUserId]);

  const handleSwitchCompany = async (targetEmpresaId: string) => {
    setSwitching(true);
    setSwitchFeedback(null);
    try {
      const res = await fetch('/api/v1/auth/switch-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          targetEmpresaId,
          motivo: `Troca de contexto via seletor global do ERP`,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const comp = data.data.activeCompany;
        setEmpresaAtiva({
          id: comp.id,
          codigo: comp.codigo,
          razaoSocial: comp.razaoSocial,
          nomeFantasia: comp.nomeFantasia,
          cnpj: comp.cnpj,
          inscricaoEstadual: comp.inscricaoEstadual,
          inscricaoMunicipal: comp.inscricaoMunicipal,
          regimeTributario: comp.regimeTributario as any,
          ramoAtividade: comp.ramoAtividade,
          isActive: comp.ativo !== false,
        });
        setSwitchFeedback(`Contexto alternado para ${comp.nomeFantasia} (Audit Log ID: ${data.data.auditLogId?.substring(0, 8)}...)`);
        setTimeout(() => setSwitchFeedback(null), 5000);
      } else {
        setSwitchFeedback(`Erro: ${data.error?.message || 'Falha ao alternar empresa.'}`);
      }
    } catch (err: any) {
      setSwitchFeedback(`Erro de comunicação: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const handleSimulateLogin = (newUserId: string) => {
    setCurrentUserId(newUserId);
  };

  // Computed Context for Simulation
  const simulatedContext: RequestTenantContext = {
    userId: 'usr-sim-001',
    userEmail: `${simRole.toLowerCase()}@industrialgroup.com.br`,
    isSuperAdmin: simRole === 'SUPERADMIN',
    empresaAtivaId: empresaAtiva.id,
    empresasAutorizadasIds:
      simRole === 'SUPERADMIN' || simRole === 'CONTADOR_GRUPO'
        ? EMPRESAS_GRUPO.map((e) => e.id)
        : simRole === 'GERENTE_PCP_TRITECH' || simRole === 'OPERADOR_LASER'
        ? ['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555']
        : ['11111111-1111-1111-1111-111111111111'],
    permissoes: [
      ...(simRole === 'GERENTE_PCP_TRITECH'
        ? [
            { empresaId: '44444444-4444-4444-4444-444444444444', modulo: 'PCP' as ModuloSistema, acao: 'ADMIN' as AcaoPermissao, permitido: true },
            { empresaId: '44444444-4444-4444-4444-444444444444', modulo: 'PRODUCAO' as ModuloSistema, acao: 'ADMIN' as AcaoPermissao, permitido: true },
            { empresaId: '44444444-4444-4444-4444-444444444444', modulo: 'CORTE' as ModuloSistema, acao: 'ADMIN' as AcaoPermissao, permitido: true },
            { empresaId: '44444444-4444-4444-4444-444444444444', modulo: 'DOBRA' as ModuloSistema, acao: 'ADMIN' as AcaoPermissao, permitido: true },
            { empresaId: '44444444-4444-4444-4444-444444444444', modulo: 'ESTOQUE' as ModuloSistema, acao: 'READ' as AcaoPermissao, permitido: true },
          ]
        : []),
      ...(simRole === 'ORCAMENTISTA_MWAM'
        ? [
            { empresaId: '11111111-1111-1111-1111-111111111111', modulo: 'ORCAMENTO' as ModuloSistema, acao: 'CREATE' as AcaoPermissao, permitido: true },
            { empresaId: '11111111-1111-1111-1111-111111111111', modulo: 'ORCAMENTO' as ModuloSistema, acao: 'READ' as AcaoPermissao, permitido: true },
            { empresaId: '11111111-1111-1111-1111-111111111111', modulo: 'ENGENHARIA' as ModuloSistema, acao: 'READ' as AcaoPermissao, permitido: true },
            { empresaId: '11111111-1111-1111-1111-111111111111', modulo: 'ESTOQUE' as ModuloSistema, acao: 'READ' as AcaoPermissao, permitido: true },
          ]
        : []),
      ...(simRole === 'OPERADOR_LASER'
        ? [
            { empresaId: '44444444-4444-4444-4444-444444444444', modulo: 'CORTE' as ModuloSistema, acao: 'CREATE' as AcaoPermissao, permitido: true },
            { empresaId: '44444444-4444-4444-4444-444444444444', modulo: 'CORTE' as ModuloSistema, acao: 'READ' as AcaoPermissao, permitido: true },
            { empresaId: '44444444-4444-4444-4444-444444444444', modulo: 'PRODUCAO' as ModuloSistema, acao: 'READ' as AcaoPermissao, permitido: true },
          ]
        : []),
      ...(simRole === 'CONTADOR_GRUPO'
        ? [
            { modulo: 'FISCAL' as ModuloSistema, acao: 'ADMIN' as AcaoPermissao, permitido: true },
            { modulo: 'FINANCEIRO' as ModuloSistema, acao: 'ADMIN' as AcaoPermissao, permitido: true },
            { modulo: 'BI' as ModuloSistema, acao: 'READ' as AcaoPermissao, permitido: true },
          ]
        : []),
    ],
    correlationId: 'corr-sim-session-001',
  };

  const filteredModules = MODULOS_ERP.filter((m) => {
    const matchCategory = filterCategory === 'TODOS' || m.categoria === filterCategory;
    const matchSearch =
      m.nome.toLowerCase().includes(searchModule.toLowerCase()) ||
      m.codigo.toLowerCase().includes(searchModule.toLowerCase()) ||
      m.descricao.toLowerCase().includes(searchModule.toLowerCase());
    return matchCategory && matchSearch;
  });

  const categories = ['TODOS', 'Core', 'Comercial', 'Engenharia & PCP', 'Manufatura', 'Qualidade & Ativos', 'Fiscal & Financeiro', 'Gestão'];

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header - Geometric Balance Design */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold text-base shadow-xs">
            Σ
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              NEXUS ERP <span className="text-slate-400 font-normal text-sm sm:text-base">| Núcleo Multiempresa</span>
            </span>
          </div>
        </div>

        {/* Active Environment & Company Selector */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {currentUserInfo?.hasGroupViewAccess ? 'Visão Grupo Autorizada' : 'Tenant Autorizado'}
            </span>
            <div className="flex items-center text-slate-900 font-semibold text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              {empresaAtiva.nomeFantasia}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          {/* Company Switcher with Backend Authoritative Validation */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-blue-600 ml-1.5 hidden md:block" />
            <select
              value={empresaAtiva.id}
              disabled={switching}
              onChange={(e) => handleSwitchCompany(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold rounded-md px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {(authorizedCompanies.length > 0 ? authorizedCompanies : EMPRESAS_GRUPO).map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.codigo} — {emp.nomeFantasia}
                </option>
              ))}
            </select>
          </div>

          {/* User Badge */}
          <div
            title={`Usuário Ativo: ${currentUserId}`}
            className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs cursor-pointer"
            onClick={() => setActiveTab('usuarios_crud')}
          >
            {currentUserInfo?.hasGroupViewAccess ? <Crown className="w-4 h-4 text-amber-400" /> : 'US'}
          </div>
        </div>
      </header>

      {/* Switch Feedback Toast */}
      {switchFeedback && (
        <div className="bg-slate-900 text-slate-100 text-xs px-4 py-2 text-center border-b border-slate-800 font-mono flex items-center justify-center gap-2">
          <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{switchFeedback}</span>
        </div>
      )}

      {/* Navigation Subheader / Geometric Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex overflow-x-auto gap-1 py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Visão Geral & Blueprint
          </button>
          <button
            onClick={() => setActiveTab('orcamentos')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orcamentos'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50/80 hover:bg-amber-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Orçamento & Formação de Preço (CPQ)
          </button>
          <button
            onClick={() => setActiveTab('credito')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'credito'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Crédito & Risco (Serasa Mock)
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'crm'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100'
            }`}
          >
            <Target className="w-4 h-4" />
            CRM & Ciclo Comercial (Módulo 06)
          </button>
          <button
            onClick={() => setActiveTab('arquivos')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'arquivos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
            }`}
          >
            <FolderLock className="w-4 h-4" />
            Arquivos & Object Storage
          </button>
          <button
            onClick={() => setActiveTab('empresas_crud')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'empresas_crud'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Empresas & CNPJs (Módulo 11)
          </button>
          <button
            onClick={() => setActiveTab('usuarios_crud')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'usuarios_crud'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuários & Vínculos Multiempresa
          </button>
          <button
            onClick={() => setActiveTab('isolation_tests')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'isolation_tests'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Testes de Isolamento & Auditoria
          </button>
          <button
            onClick={() => setActiveTab('modulos')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'modulos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Workflow className="w-4 h-4" />
            20 Módulos ({MODULOS_ERP.length})
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            Banco & Migrations
          </button>
          <button
            onClick={() => setActiveTab('adr')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'adr'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            Decisões ADR & Adapters
          </button>
          <button
            onClick={() => setActiveTab('rbac_sim')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rbac_sim'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Simulador RBAC & Tenant
          </button>
          <button
            onClick={() => setActiveTab('skeleton')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'skeleton'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100'
            }`}
          >
            <Server className="w-4 h-4" />
            Esqueleto Executável (API & Infra)
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 bg-red-50/70 hover:bg-red-100'
            }`}
          >
            <Lock className="w-4 h-4" />
            Segurança & Ambientes
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* TAB: ORÇAMENTO TÉCNICO & FORMAÇÃO DE PREÇO CPQ */}
        {activeTab === 'orcamentos' && <OrcamentoViewer empresaAtiva={empresaAtiva} />}

        {/* TAB: CRÉDITO & RISCO (SERASA MOCK ADAPTER + MOTOR) */}
        {activeTab === 'credito' && <CreditoViewer empresaAtiva={empresaAtiva} />}

        {/* TAB: CRM INDUSTRIAL & CICLO COMERCIAL */}
        {activeTab === 'crm' && <CrmViewer empresaAtiva={empresaAtiva} />}

        {/* TAB: STORAGE DE ARQUIVOS & DOCUMENTOS */}
        {activeTab === 'arquivos' && <FileManagementViewer empresaAtiva={empresaAtiva} />}

        {/* TAB: EMPRESAS & CNPJS CRUD */}
        {activeTab === 'empresas_crud' && <CompanyManagementViewer />}

        {/* TAB: USUARIOS & VÍNCULOS CRUD */}
        {activeTab === 'usuarios_crud' && (
          <UserManagementViewer
            currentActiveUserId={currentUserId}
            onSimulateLogin={handleSimulateLogin}
          />
        )}

        {/* TAB: TESTES DE ISOLAMENTO & AUDITORIA */}
        {activeTab === 'isolation_tests' && <MultiTenantTestingViewer />}

        {/* TAB 1: OVERVIEW & BLUEPRINT */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Header Title Section with Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard do Arquiteto</h1>
                <p className="text-slate-500 text-sm mt-0.5">Núcleo Multiempresa Ativo — 5 CNPJs, Isolamento Estrito & Governança</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('empresas_crud')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-md shadow-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors"
                >
                  Gerenciar Empresas
                </button>
                <button
                  onClick={() => setActiveTab('isolation_tests')}
                  className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-md shadow-xs uppercase tracking-wider hover:bg-rose-700 transition-colors"
                >
                  Ver Testes de Isolamento
                </button>
              </div>
            </div>

            {/* Geometric KPI Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Segurança de Dados</div>
                <div className="text-2xl font-bold text-slate-900">Isolation Level 4</div>
                <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>
                  RLS PostgreSQL Ativo por empresa_id
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Escalabilidade</div>
                <div className="text-2xl font-bold text-slate-900">Stateless API</div>
                <div className="mt-2 text-xs text-blue-600 font-semibold flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                  Adapters: Serasa, Fiscal, Storage, CNAB
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Auditoria</div>
                <div className="text-2xl font-bold text-slate-900">Full Traceability</div>
                <div className="mt-2 text-xs text-purple-600 font-semibold flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>
                  Log de Transações Críticas (No-Delete)
                </div>
              </div>
            </div>

            {/* Active Company Details Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      CONTEXTO ATUAL DE SESSÃO
                    </span>
                    <span className="text-xs text-slate-400 font-mono">UUID: {empresaAtiva.id}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{empresaAtiva.razaoSocial}</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">{empresaAtiva.ramoAtividade}</p>
                </div>
                <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">CNPJ</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{empresaAtiva.cnpj}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Regime</span>
                    <span className="text-xs font-semibold text-slate-800">{empresaAtiva.regimeTributario}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Status</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Operacional
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Row: Project Tree + Multi-Company Entities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Structure Dark Terminal Panel */}
              <div className="bg-slate-900 rounded-xl p-6 overflow-hidden border border-slate-800 flex flex-col shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Estrutura do Projeto (PROJETO_TREE)</h3>
                  <span className="text-[10px] text-blue-400 font-mono">v1.0.0-hexagonal</span>
                </div>
                <div className="flex-1 overflow-auto font-mono text-[12px] leading-relaxed text-slate-300 space-y-1">
                  <div className="text-blue-400 font-bold">nexus-erp/</div>
                  <div className="pl-4">├── <span className="text-emerald-400 font-semibold">docs/</span> (ARCHITECTURE, DOMAIN, DECISIONS)</div>
                  <div className="pl-4">├── <span className="text-emerald-400 font-semibold">database/</span></div>
                  <div className="pl-8 text-slate-400">├── migrations/ (0001 a 0004 SQL DDL)</div>
                  <div className="pl-8 text-slate-400">└── seeds/ (0001_seed_initial_companies)</div>
                  <div className="pl-4">├── <span className="text-emerald-400 font-semibold">backend/</span> (Node.js & Hexagonal Ports)</div>
                  <div className="pl-8 text-slate-200">├── core/ (Types, Middlewares, Security A1)</div>
                  <div className="pl-8 text-slate-200">├── ports/ (Fiscal, Banking, Serasa, Storage)</div>
                  <div className="pl-8 text-slate-400">├── adapters/ (FocusNFe, CNAB240, S3) [TODO]</div>
                  <div className="pl-8 text-slate-200">└── modules/ (Catálogo dos 20 Módulos)</div>
                  <div className="pl-4">├── <span className="text-emerald-400 font-semibold">tests/</span> (Unit & Intercompany Integration)</div>
                  <div className="pl-4">├── .env.example (Variáveis declaradas)</div>
                  <div className="pl-4">└── metadata.json</div>
                </div>
              </div>

              {/* Multi-Company Entities Card */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Entidades Multiempresa (5 CNPJs)</h3>
                    <span className="text-xs font-semibold text-blue-600">5/5 Integrados</span>
                  </div>

                  <div className="space-y-2.5">
                    {EMPRESAS_GRUPO.map((emp) => {
                      const isActive = empresaAtiva.id === emp.id;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => setEmpresaAtiva(emp)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            isActive
                              ? 'border-blue-300 bg-blue-50/80 shadow-xs'
                              : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-400'}`}></div>
                            <div>
                              <span className={`text-xs font-bold ${isActive ? 'text-blue-950' : 'text-slate-800'}`}>
                                {emp.nomeFantasia}
                              </span>
                              <span className="text-[10px] text-slate-500 block">{emp.codigo} — {emp.regimeTributario}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono font-semibold ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                            {emp.cnpj}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>PostgreSQL 16 Status</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> CONNECTED (RLS ON)
                  </span>
                </div>
              </div>
            </div>

            {/* Core Architectural Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Multiempresa Real</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Coluna <code className="text-blue-600 font-mono font-semibold">empresa_id</code> em todas as transações, RLS ativo no PostgreSQL e catálogo mestre compartilhado.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Auditoria Append-Only</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Proibição estrita de Hard Delete. Histórico de alterações com snapshots JSONB de before/after e rastreamento de IP/User.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Hexagonal & Ports</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Desacoplamento de SEFAZ, Serasa, Bancos (CNAB 240/400) e Object Storage através de contratos de portas abstratas.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">IA Desacoplada</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  O ERP é 100% determinístico e autônomo. A inteligência futura será conectada exclusivamente como consumidor satélite.
                </p>
              </div>
            </div>

            {/* Execution Flow Diagram */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-blue-600" />
                    Fluxo de Execução Transacional e Isolamento
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Como cada requisição trafega garantindo a integridade dos 5 CNPJs industriais</p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-md text-slate-700 font-semibold border border-slate-200">
                  Node.js / TS + PostgreSQL 16
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center mb-2 font-mono text-xs">1</span>
                  <h4 className="font-bold text-slate-800 mb-1">Cliente & Switcher</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Requisição com cabeçalhos <code className="text-blue-600 font-semibold font-mono">Authorization</code> e <code className="text-blue-600 font-semibold font-mono">X-Empresa-ID</code>.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center mb-2 font-mono text-xs">2</span>
                  <h4 className="font-bold text-slate-800 mb-1">Tenant Middleware</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Valida se o usuário tem vínculo ativo na tabela <code className="text-blue-600 font-semibold font-mono">usuario_empresas</code>.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-md bg-purple-600 text-white font-bold flex items-center justify-center mb-2 font-mono text-xs">3</span>
                  <h4 className="font-bold text-slate-800 mb-1">RBAC 3D Guard</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Avalia a permissão tridimensional <code className="text-purple-600 font-semibold font-mono">(empresa, modulo, acao)</code>.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center mb-2 font-mono text-xs">4</span>
                  <h4 className="font-bold text-slate-800 mb-1">Core & Ports</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Executa regras de negócio puras e delega para adaptadores externos via interfaces estritas.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-bold flex items-center justify-center mb-2 font-mono text-xs">5</span>
                  <h4 className="font-bold text-slate-800 mb-1">PostgreSQL & Audit</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Persiste a transação com <code className="text-rose-600 font-semibold font-mono">empresa_id</code> e grava evento imutável em <code className="text-rose-600 font-semibold font-mono">audit_logs</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 5 EMPRESAS */}
        {activeTab === 'empresas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Empresas do Grupo Industrial</h2>
                <p className="text-xs text-slate-500 mt-1">Os 5 CNPJs integrados ao sistema com regras de isolamento e transações intercompany</p>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-200 font-bold">
                5 EMPRESAS ATIVAS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EMPRESAS_GRUPO.map((empresa, idx) => {
                const isSelected = empresaAtiva.id === empresa.id;
                return (
                  <div
                    key={empresa.id}
                    className={`bg-white border rounded-xl p-6 transition-all flex flex-col justify-between shadow-xs ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-7 h-7 rounded-md bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                          0{idx + 1}
                        </span>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {empresa.codigo}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{empresa.razaoSocial}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 mb-4">{empresa.nomeFantasia}</p>

                      <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">CNPJ:</span>
                          <span className="font-mono font-bold text-slate-900">{empresa.cnpj}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Inscrição Estadual:</span>
                          <span className="font-mono text-slate-700">{empresa.inscricaoEstadual || 'ISENTO'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Regime Tributário:</span>
                          <span className="font-semibold text-slate-800">{empresa.regimeTributario}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-900">Ramo de Atividade:</strong> {empresa.ramoAtividade}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">UUID: {empresa.id.substring(0, 8)}...</span>
                      <button
                        onClick={() => setEmpresaAtiva(empresa)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Empresa Ativa' : 'Selecionar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: 20 MÓDULOS DO SISTEMA */}
        {activeTab === 'modulos' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Catálogo dos 20 Módulos do ERP</h2>
                <p className="text-xs text-slate-500 mt-1">Escopo funcional, entidades principais, contratos de porta e status de isolamento</p>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchModule}
                    onChange={(e) => setSearchModule(e.target.value)}
                    placeholder="Filtrar módulo ou entidade..."
                    className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-md font-bold whitespace-nowrap transition-colors ${
                    filterCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Modules Grid + Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModules.map((mod) => {
                  const isSelected = selectedModule?.id === mod.id;
                  return (
                    <div
                      key={mod.id}
                      onClick={() => setSelectedModule(mod)}
                      className={`bg-white p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {mod.categoria}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              mod.statusIntegracao === 'PRONTO_PARA_IMPLEMENTACAO'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {mod.statusIntegracao === 'PRONTO_PARA_IMPLEMENTACAO' ? 'Core Pronto' : 'TODO Adapter'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{mod.nome}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{mod.descricao}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono font-bold">{mod.codigo}</span>
                        <span className="text-blue-600 font-bold flex items-center gap-1">
                          Inspecionar <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Module Detail Inspector */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-24 h-fit shadow-xs">
                {selectedModule ? (
                  <div className="space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <span className="text-xs font-mono text-blue-600 uppercase font-bold">{selectedModule.codigo}</span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedModule.nome}</h3>
                      <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {selectedModule.categoria}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descrição do Domínio</h5>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {selectedModule.descricao}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Entidades Principais (DDL)</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedModule.entidadesPrincipais.map((ent) => (
                          <span key={ent} className="text-xs font-mono bg-slate-100 text-slate-800 font-medium px-2 py-1 rounded border border-slate-200">
                            {ent}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Isolamento Multiempresa</h5>
                      <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-slate-700 font-medium">
                          {selectedModule.isolamentoEmpresa === 'ESTRITO_TRANSACIONAL'
                            ? 'Isolamento estrito por empresa_id (Transações e movimentos)'
                            : 'Catálogo Mestre Compartilhado com Extensão por Empresa'}
                        </span>
                      </div>
                    </div>

                    {selectedModule.dependenciasExternas.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Dependências Externas (TODO)
                        </h5>
                        <ul className="text-xs text-amber-900 space-y-1 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                          {selectedModule.dependenciasExternas.map((dep) => (
                            <li key={dep} className="flex items-center gap-1.5 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              {dep}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">Selecione um módulo para inspecionar</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE & MIGRATIONS */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Estrutura de Banco de Dados (PostgreSQL 16)</h2>
              <p className="text-xs text-slate-500 mt-1">Migrations versionadas, índices multi-tenant e schema de auditoria imutável</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-blue-600">0001_initial_core_schema.sql</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Aplicada
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Núcleo Multiempresa, RBAC & Auditoria</h4>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Cria tabelas <code className="text-slate-900 font-mono font-semibold">empresas</code>, <code className="text-slate-900 font-mono font-semibold">usuarios</code>, <code className="text-slate-900 font-mono font-semibold">usuario_empresas</code>, <code className="text-slate-900 font-mono font-semibold">perfis_acesso</code>, <code className="text-slate-900 font-mono font-semibold">permissoes</code> e a tabela append-only <code className="text-blue-600 font-mono font-semibold">audit_logs</code>.
                </p>
                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                  CREATE TABLE audit_logs (id UUID PRIMARY KEY, empresa_id UUID NOT NULL, ...);
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-blue-600">0002_catalog_and_inventory.sql</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Aplicada
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Parceiros, Itens & Estoque de Chapas/Perfis</h4>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Cria <code className="text-slate-900 font-mono font-semibold">parceiros</code>, <code className="text-slate-900 font-mono font-semibold">itens</code>, <code className="text-slate-900 font-mono font-semibold">almoxarifados</code>, <code className="text-slate-900 font-mono font-semibold">lotes</code> (com certificados de usina) e <code className="text-blue-600 font-mono font-semibold">movimentacoes_estoque</code> (imutável).
                </p>
                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                  CREATE INDEX idx_mov_estoque_empresa_item ON movimentacoes_estoque(empresa_id, item_id);
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-blue-600">0003_manufacturing_and_services.sql</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Aplicada
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Engenharia (BOM), OPs, Corte, Dobra & O.S.</h4>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Cria <code className="text-slate-900 font-mono font-semibold">engenharia_bom</code>, <code className="text-slate-900 font-mono font-semibold">ordens_producao</code>, <code className="text-slate-900 font-mono font-semibold">ordens_corte</code>, <code className="text-slate-900 font-mono font-semibold">retalhos_gerados</code>, <code className="text-slate-900 font-mono font-semibold">ordens_dobra</code> e <code className="text-slate-900 font-mono font-semibold">ordens_servico</code>.
                </p>
                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                  CREATE TABLE retalhos_gerados (id UUID, empresa_id UUID, largura_util_mm, etiqueta_qr_code...);
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-blue-600">0004_fiscal_and_financial.sql</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Aplicada
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Orçamentos, Pedidos, Financeiro & Fiscal</h4>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Cria <code className="text-slate-900 font-mono font-semibold">orcamentos</code>, <code className="text-slate-900 font-mono font-semibold">pedidos_venda</code>, <code className="text-slate-900 font-mono font-semibold">titulos_receber</code>, <code className="text-slate-900 font-mono font-semibold">titulos_pagar</code> e <code className="text-slate-900 font-mono font-semibold">documentos_fiscais</code> (NF-e/NFS-e/MDF-e).
                </p>
                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                  CREATE TABLE titulos_receber (id UUID, empresa_id UUID, valor_saldo, status...);
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ADR DECISION LOG */}
        {activeTab === 'adr' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Registros de Decisões de Arquitetura (ADRs)</h2>
              <p className="text-xs text-slate-500 mt-1">Decisões tomadas e registro formal de itens pendentes de definição externa</p>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-blue-600 font-bold">ADR-001</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Aprovada
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Shared Database com `empresa_id` Obrigatório & RLS</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Isolamento garantido via Tenant Middleware + Queries escopadas + PostgreSQL Row-Level Security para relatórios consolidados no BI e transações intercompany eficientes.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-blue-600 font-bold">ADR-002</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Aprovada
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Monolito Modular com Arquitetura Hexagonal</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Preserva transações ACID locais no PostgreSQL para fechamento de OPs e movimentação de estoque, com limites claros de domínio para futura extração de microserviços se necessário.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-blue-600 font-bold">ADR-003</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Aprovada
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Política de Imutabilidade e Proibição de Hard Delete</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Nenhum registro fiscal, contábil, financeiro, de estoque ou ordem de produção pode ser excluído fisicamente. Cancelamentos operam por contra-partida e soft-delete auditado.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-amber-700 font-bold">ADR-006</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                    TODO / decision-needed
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Dependências Externas em Aberto</h4>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Motor Fiscal (NF-e/NFS-e):</strong> Homologação de provedor SaaS (FocusNFe / PlugNotas / Nuvem Fiscal) vs Gateway interno com certificado A1.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Integração Bancária:</strong> Definição de layouts CNAB 240/400 ou APIs de cobrança direta para cada banco dos 5 CNPJs.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Crédito Serasa:</strong> Contratação de pacote Serasa Experian PJ para análise de score automatizada.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RBAC & TENANT SIMULATOR */}
        {activeTab === 'rbac_sim' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Simulador de Permissões RBAC e Isolamento Multiempresa</h2>
              <p className="text-xs text-slate-500 mt-1">
                Teste em tempo real como o contexto de tenant e perfil de usuário afeta o acesso aos 20 módulos na empresa ativa
              </p>
            </div>

            {/* Simulator Controls */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Perfil Simulado
                  </label>
                  <select
                    value={simRole}
                    onChange={(e) => setSimRole(e.target.value as any)}
                    className="w-full bg-slate-50 text-slate-900 text-xs font-semibold rounded-lg px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="GERENTE_PCP_TRITECH">Gerente de PCP & Produção (Tritech Corte & Dobra / Industrial)</option>
                    <option value="ORCAMENTISTA_MWAM">Orçamentista Técnico (MWAM Engenharia)</option>
                    <option value="OPERADOR_LASER">Operador de Máquina Laser (Tritech Corte)</option>
                    <option value="CONTADOR_GRUPO">Contador Corporativo (Todas as 5 Empresas)</option>
                    <option value="SUPERADMIN">Super Administrador do Grupo</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Empresa Alvo (Ativa no Cabeçalho)
                  </label>
                  <select
                    value={empresaAtiva.id}
                    onChange={(e) => {
                      const emp = EMPRESAS_GRUPO.find((x) => x.id === e.target.value);
                      if (emp) setEmpresaAtiva(emp);
                    }}
                    className="w-full bg-slate-50 text-slate-900 text-xs font-semibold rounded-lg px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {EMPRESAS_GRUPO.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.codigo} — {emp.nomeFantasia}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-semibold">Status de Tenant:</span>
                  {simulatedContext.empresasAutorizadasIds.includes(empresaAtiva.id) || simulatedContext.isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Autorizado na Empresa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                      <ShieldAlert className="w-4 h-4" /> ACESSO NEGADO À EMPRESA (HTTP 403 Forbidden)
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400 font-semibold">CorrID: {simulatedContext.correlationId}</span>
              </div>
            </div>

            {/* Matrix of 20 modules permission evaluation */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Matriz de Acesso aos 20 Módulos no Contexto Atual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {MODULOS_ERP.map((mod) => {
                  const canRead = hasPermission(simulatedContext, mod.codigo as ModuloSistema, 'READ');
                  const canCreate = hasPermission(simulatedContext, mod.codigo as ModuloSistema, 'CREATE');
                  const canAdmin = hasPermission(simulatedContext, mod.codigo as ModuloSistema, 'ADMIN');

                  const isEmpresaAllowed =
                    simulatedContext.empresasAutorizadasIds.includes(empresaAtiva.id) || simulatedContext.isSuperAdmin;

                  const hasAnyAccess = isEmpresaAllowed && (canRead || canCreate || canAdmin);

                  return (
                    <div
                      key={mod.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        hasAnyAccess
                          ? 'bg-white border-emerald-200 shadow-xs'
                          : 'bg-slate-50 border-slate-200 opacity-50'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{mod.nome}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">{mod.codigo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasAnyAccess ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {canAdmin ? 'ADMIN' : canCreate ? 'READ + WRITE' : 'READ ONLY'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            BLOQUEADO
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* TAB 7: EXECUTABLE SKELETON & RUNTIME INFRA */}
        {activeTab === 'skeleton' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Esqueleto Executável do ERP</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Runtime TypeScript (Frontend React + Backend Node.js), PostgreSQL 16 com Drizzle ORM, Logger Estruturado e API versionada /api/v1.
              </p>
            </div>

            {/* Health Status Widget */}
            <HealthStatusCard />

            {/* Core Infrastructure Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Middleware de Request-ID & Tenant
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Injeção e propagação automática de <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-[10px]">x-request-id</code> e <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-[10px]">x-correlation-id</code> em todas as requisições para rastreabilidade de ponta a ponta.
                </p>
                <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  ✓ RBAC 3D: (empresa_id, modulo, acao)
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Database className="w-4 h-4 text-purple-600" />
                  Drizzle ORM & Migrations Versionadas
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  PostgreSQL 16 com pooling configurável (<code className="font-mono text-[10px]">pg.Pool</code>), migrations versionadas em <code className="font-mono text-[10px]">migrations/</code> e tracking de execução com <code className="font-mono text-[10px]">schema_migrations</code>.
                </p>
                <div className="text-[10px] font-mono text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
                  ✓ 4 Migrations SQL + Seeds Idempotentes
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  Padronização de Erros & Paginação
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Tratamento global de erros baseado em hierarquia <code className="font-mono text-[10px]">AppError</code> (RFC 7807) e paginação padrão com <code className="font-mono text-[10px]">{`{ page, limit, totalItems, totalPages }`}</code>.
                </p>
                <div className="text-[10px] font-mono text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  ✓ Respostas Envelope & Zod Validation
                </div>
              </div>
            </div>

            {/* Interactive API Tester */}
            <ApiInspector />
          </div>
        )}

        {/* TAB 8: SECURITY & ENVIRONMENTS MATRIX */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Segurança & Configuração de Ambientes</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Defesas ativas nos ambientes DEV, STAGING e PROD: Rate Limiting, Headers OWASP, CORS, Proteção Anti-Leak de Stacks e Mascaramento de Dados.
              </p>
            </div>

            <SecurityMatrixViewer />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">NEXUS ERP — Grupo Industrial Multiempresa (5 CNPJs)</span>
          <span className="text-slate-400 font-mono text-[11px]">Design Theme: Geometric Balance | PostgreSQL RLS Active</span>
        </div>
      </footer>
    </div>
  );
}
