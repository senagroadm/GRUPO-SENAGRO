'use client';

import React, { useState, useEffect } from 'react';
import { Empresa, EMPRESAS_GRUPO } from '../backend/core/types/company';
import { AuditoriaViewer } from '../frontend/src/components/AuditoriaViewer';
import { NotificacoesViewer } from '../frontend/src/components/NotificacoesViewer';
import { RelatoriosViewer } from '../frontend/src/components/RelatoriosViewer';
import { OrcamentoViewer } from '../frontend/src/components/OrcamentoViewer';
import { ComprasViewer } from '../frontend/src/components/ComprasViewer';
import { EstoqueViewer } from '../frontend/src/components/EstoqueViewer';
import { ProducaoViewer } from '../frontend/src/components/ProducaoViewer';
import { QualidadeViewer } from '../frontend/src/components/QualidadeViewer';
import { FiscalViewer } from '../frontend/src/components/FiscalViewer';
import { ExpedicaoViewer } from '../frontend/src/components/ExpedicaoViewer';
import { ManutencaoViewer } from '../frontend/src/components/ManutencaoViewer';
import { PatrimonioViewer } from '../frontend/src/components/PatrimonioViewer';
import { FinanceiroViewer } from '../frontend/src/components/FinanceiroViewer';
import { TritechAiBridgeViewer } from '../frontend/src/components/TritechAiBridgeViewer';
import { PerformanceJobsViewer } from '../frontend/src/components/PerformanceJobsViewer';
import { BackupRecoveryViewer } from '../frontend/src/components/BackupRecoveryViewer';
import { AcceptanceTestsViewer } from '../frontend/src/components/AcceptanceTestsViewer';
import { SecurityHardeningViewer } from '../frontend/src/components/SecurityHardeningViewer';
import { ObservabilidadeViewer } from '../frontend/src/components/ObservabilidadeViewer';
import { UxStandardizationViewer } from '../frontend/src/components/UxStandardizationViewer';
import {
  Building2,
  Factory,
  ShoppingCart,
  ShoppingBag,
  Boxes,
  ShieldCheck,
  Receipt,
  Truck,
  Wrench,
  Gauge,
  Landmark,
  ScrollText,
  Bell,
  BarChart3,
  Sparkles,
  Zap,
  Database,
  FlaskConical,
  Lock,
  HeartPulse,
  LayoutTemplate,
  User,
  CheckCircle2,
  ChevronRight,
  Shield,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

export type UserRole = 'ADMIN' | 'COLABORADOR';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  alcada: number;
  cargo: string;
}

const PROFILES: Record<UserRole, UserProfile> = {
  ADMIN: {
    id: 'usr-admin-principal',
    name: 'Administrador Principal',
    email: 'dgdiniz99@gmail.com',
    role: 'ADMIN',
    alcada: 5,
    cargo: 'Super Admin • Diretoria Executiva',
  },
  COLABORADOR: {
    id: 'usr-colab-padrao',
    name: 'Colaborador Padrão',
    email: 'operacao@tritech.ind.br',
    role: 'COLABORADOR',
    alcada: 1,
    cargo: 'Operador / Analista de Processos',
  },
};

const ADMIN_TAB_IDS = new Set([
  'auditoria',
  'notificacoes',
  'relatorios',
  'tritechAi',
  'performance',
  'backup',
  'testesAceitacao',
  'seguranca',
  'observabilidade',
  'uxPadronizacao',
]);

interface MenuItem {
  id: string;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  title: string;
  requiredRole?: UserRole;
  items: MenuItem[];
}

export default function ArchitectureDashboard() {
  const [activeTab, setActiveTab] = useState<string>('comercial');
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa>(EMPRESAS_GRUPO[0]);
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');

  const currentUser = PROFILES[activeRole];

  // Se o usuário alternar para Colaborador e estiver em aba administrativa, redireciona para a primeira aba operacional
  useEffect(() => {
    if (activeRole === 'COLABORADOR' && ADMIN_TAB_IDS.has(activeTab)) {
      setActiveTab('comercial');
    }
  }, [activeRole, activeTab]);

  const handleEmpresaChange = (empresaId: string) => {
    const encontrada = EMPRESAS_GRUPO.find((e) => e.id === empresaId);
    if (encontrada) {
      setEmpresaAtiva(encontrada);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'COLABORADOR' && ADMIN_TAB_IDS.has(activeTab)) {
      setActiveTab('comercial');
    }
  };

  const allMenuSections: MenuSection[] = [
    {
      title: 'Operações & Negócios',
      items: [
        { id: 'comercial', label: 'Comercial & CPQ', icon: ShoppingCart },
        { id: 'suprimentos', label: 'Suprimentos & Compras', icon: ShoppingBag },
        { id: 'estoque', label: 'Estoque & Intercompany', icon: Boxes },
        { id: 'chaoFabrica', label: 'Chão de Fábrica / PCP', icon: Factory },
        { id: 'qualidade', label: 'Qualidade & RNC', icon: ShieldCheck },
        { id: 'expedicaoLogistica', label: 'Expedição & Logística', icon: Truck },
        { id: 'expedicaoFiscal', label: 'Faturamento & Fiscal', icon: Receipt },
        { id: 'financeiro', label: 'Financeiro & Bancos', icon: Landmark },
      ],
    },
    {
      title: 'Ativos, Manutenção & Ferramentaria',
      items: [
        { id: 'manutencao', label: 'Manutenção Industrial (PCM)', icon: Wrench },
        { id: 'patrimonio', label: 'Patrimônio & Calibração', icon: Gauge },
      ],
    },
    {
      title: 'Administração & Governança',
      requiredRole: 'ADMIN',
      items: [
        { id: 'auditoria', label: 'Auditoria & Trilha Imutável', icon: ScrollText },
        { id: 'notificacoes', label: 'Notificações & Pendências', icon: Bell, badge: '5' },
        { id: 'relatorios', label: 'Motor de Relatórios', icon: BarChart3 },
        { id: 'tritechAi', label: 'Tritech AI (Gateway)', icon: Sparkles },
        { id: 'performance', label: 'Desempenho & Jobs', icon: Zap },
        { id: 'backup', label: 'Backup & Continuidade', icon: Database },
        { id: 'testesAceitacao', label: 'Testes de Aceitação (E2E)', icon: FlaskConical },
        { id: 'seguranca', label: 'Segurança & Hardening LGPD', icon: Lock },
        { id: 'observabilidade', label: 'Observabilidade & Suporte', icon: HeartPulse },
        { id: 'uxPadronizacao', label: 'UX & Padronização', icon: LayoutTemplate },
      ],
    },
  ];

  // Filtra seções baseadas no RBAC
  const visibleMenuSections = allMenuSections.filter((section) => {
    if (section.requiredRole === 'ADMIN' && activeRole !== 'ADMIN') {
      return false;
    }
    return true;
  });

  // Helper para obter o título do módulo ativo
  const getActiveModule = () => {
    for (const section of allMenuSections) {
      const found = section.items.find((item) => item.id === activeTab);
      if (found) return { section: section.title, item: found };
    }
    return { section: 'Módulo', item: { id: activeTab, label: 'Painel', icon: Factory } };
  };

  const activeInfo = getActiveModule();
  const ActiveIcon = activeInfo.item.icon;
  const isAccessDenied = activeRole !== 'ADMIN' && ADMIN_TAB_IDS.has(activeTab);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-row font-sans">
      
      {/* SIDEBAR LATERAL ESQUERDA */}
      <aside 
        id="nexus-sidebar"
        className="w-72 bg-slate-950 text-slate-300 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30"
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3 bg-slate-900/60">
          <div className="bg-indigo-600 text-white p-2 rounded-lg font-black text-xs tracking-wider shadow-sm flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm tracking-tight">NEXUS ERP</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-900/80 text-indigo-300 rounded border border-indigo-700/50">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Grupo TRITECH • 5 CNPJs</p>
          </div>
        </div>

        {/* Status Rápido do Tenant e Perfil RBAC */}
        <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/50 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-300">Tenant:</span>
            <strong className="text-white font-mono text-[10px]">{empresaAtiva.codigo}</strong>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              activeRole === 'ADMIN'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700/60'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
            }`}
          >
            {activeRole === 'ADMIN' ? 'Super Admin' : 'Colaborador'}
          </span>
        </div>

        {/* Menu de Navegação Vertical com Categorias Condicionais */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {visibleMenuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>{section.title}</span>
                <span className="text-slate-600 font-mono">({section.items.length})</span>
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer group ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-white text-indigo-900'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer do Usuário na Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${
                activeRole === 'ADMIN'
                  ? 'bg-indigo-950 border-indigo-700/60 text-indigo-300'
                  : 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-200 truncate">{currentUser.email}</p>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Shield className={`w-3 h-3 ${activeRole === 'ADMIN' ? 'text-indigo-400' : 'text-emerald-400'}`} />
                <span>{currentUser.role === 'ADMIN' ? 'Super Admin' : 'Colaborador'}</span>
                <span>•</span>
                <span>Alçada {currentUser.alcada}</span>
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL À DIREITA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header da Área Principal */}
        <header 
          id="nexus-top-header"
          className="bg-white border-b border-slate-200 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs"
        >
          {/* Breadcrumb & Identificação do Módulo */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span>{activeInfo.section}</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-indigo-600 font-bold">{activeInfo.item.label}</span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
                {activeInfo.item.label}
              </h2>
            </div>
          </div>

          {/* Controles de Governança, RBAC & Seletor de Empresa */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Seletor Rápido de Perfil RBAC (Mock/Simulação de Usuário) */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <div className="p-1 rounded bg-white shadow-2xs text-indigo-600 border border-slate-200">
                {activeRole === 'ADMIN' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 leading-none">
                  Perfil de Acesso (RBAC)
                </span>
                <select
                  id="rbac-profile-selector"
                  className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer pr-2 pt-0.5"
                  value={activeRole}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                >
                  <option value="ADMIN">Administrador Principal (Super Admin)</option>
                  <option value="COLABORADOR">Colaborador Padrão (Operacional)</option>
                </select>
              </div>
            </div>

            {/* Tag de Isolamento e Segurança */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>RLS 100% Ativo</span>
            </div>

            {/* Seletor de Empresa Ativa (Multiempresa) */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 leading-none">
                  Empresa Ativa
                </span>
                <select
                  id="empresa-ativa-selector"
                  className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer pr-2 pt-0.5"
                  value={empresaAtiva.id}
                  onChange={(e) => handleEmpresaChange(e.target.value)}
                >
                  {EMPRESAS_GRUPO.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nomeFantasia} ({emp.codigo}) — {emp.cnpj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </header>

        {/* Área de Conteúdo dos Componentes com Segurança de Rota */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {/* Bloqueio de Acesso para Colaboradores em Rotas Administrativas */}
          {isAccessDenied ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-xl mx-auto my-12 shadow-xs">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-300">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-amber-900 mb-1">Acesso Restrito ao Módulo</h3>
              <p className="text-xs text-amber-700 mb-4 leading-relaxed">
                O módulo <strong className="font-semibold">{activeInfo.item.label}</strong> faz parte da governança e administração central do Grupo TRITECH e requer privilégios de <strong>Administrador Principal (Super Admin)</strong>.
              </p>
              <button
                onClick={() => setActiveTab('comercial')}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
              >
                Retornar aos Módulos Operacionais
              </button>
            </div>
          ) : (
            <>
              {/* Módulos Operacionais */}
              {activeTab === 'comercial' && <OrcamentoViewer empresaAtiva={empresaAtiva} />}
              {activeTab === 'suprimentos' && <ComprasViewer empresaAtiva={empresaAtiva} />}
              {activeTab === 'estoque' && <EstoqueViewer empresaAtiva={empresaAtiva} />}
              {activeTab === 'chaoFabrica' && <ProducaoViewer empresaId={empresaAtiva.id} />}
              {activeTab === 'qualidade' && <QualidadeViewer empresaAtiva={empresaAtiva} />}
              {activeTab === 'expedicaoLogistica' && <ExpedicaoViewer empresaAtiva={empresaAtiva} />}
              {activeTab === 'expedicaoFiscal' && <FiscalViewer empresaAtiva={empresaAtiva} />}
              {activeTab === 'financeiro' && <FinanceiroViewer empresaAtiva={empresaAtiva} />}
              {activeTab === 'manutencao' && <ManutencaoViewer empresaAtiva={empresaAtiva} />}
              {activeTab === 'patrimonio' && <PatrimonioViewer empresaAtiva={empresaAtiva} />}

              {/* Módulos Administrativos & Governança (Exclusivos para ADMIN) */}
              {activeRole === 'ADMIN' && (
                <>
                  {activeTab === 'auditoria' && <AuditoriaViewer empresaAtiva={empresaAtiva} />}
                  {activeTab === 'notificacoes' && <NotificacoesViewer />}
                  {activeTab === 'relatorios' && <RelatoriosViewer />}
                  {activeTab === 'tritechAi' && <TritechAiBridgeViewer />}
                  {activeTab === 'performance' && <PerformanceJobsViewer />}
                  {activeTab === 'backup' && <BackupRecoveryViewer />}
                  {activeTab === 'testesAceitacao' && <AcceptanceTestsViewer />}
                  {activeTab === 'seguranca' && <SecurityHardeningViewer />}
                  {activeTab === 'observabilidade' && <ObservabilidadeViewer />}
                  {activeTab === 'uxPadronizacao' && <UxStandardizationViewer />}
                </>
              )}
            </>
          )}
        </main>

      </div>

    </div>
  );
}
