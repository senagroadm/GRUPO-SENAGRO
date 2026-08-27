'use client';

import React, { useState } from 'react';
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
import { FinanceiroViewer } from '../frontend/src/components/FinanceiroViewer';
import { TritechAiBridgeViewer } from '../frontend/src/components/TritechAiBridgeViewer';
import { PerformanceJobsViewer } from '../frontend/src/components/PerformanceJobsViewer';
import { BackupRecoveryViewer } from '../frontend/src/components/BackupRecoveryViewer';
import { AcceptanceTestsViewer } from '../frontend/src/components/AcceptanceTestsViewer';
import { SecurityHardeningViewer } from '../frontend/src/components/SecurityHardeningViewer';
import { ObservabilidadeViewer } from '../frontend/src/components/ObservabilidadeViewer';
import { UxStandardizationViewer } from '../frontend/src/components/UxStandardizationViewer';

export default function ArchitectureDashboard() {
  const [activeTab, setActiveTab] = useState<string>('comercial');
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa>(EMPRESAS_GRUPO[0]);

  const handleEmpresaChange = (empresaId: string) => {
    const encontrada = EMPRESAS_GRUPO.find((e) => e.id === empresaId);
    if (encontrada) {
      setEmpresaAtiva(encontrada);
    }
  };

  const tabs = [
    { id: 'auditoria', label: 'Auditoria & Trilha Imutável' },
    { id: 'notificacoes', label: 'Notificações & Pendências' },
    { id: 'relatorios', label: 'Motor de Relatórios' },
    { id: 'comercial', label: 'Comercial & CPQ' },
    { id: 'suprimentos', label: 'Suprimentos & Compras' },
    { id: 'estoque', label: 'Estoque & Intercompany' },
    { id: 'chaoFabrica', label: 'Chão de Fábrica / PCP' },
    { id: 'qualidade', label: 'Qualidade & RNC' },
    { id: 'expedicaoFiscal', label: 'Expedição & Fiscal' },
    { id: 'financeiro', label: 'Financeiro & Bancos' },
    { id: 'tritechAi', label: 'Tritech AI (Gateway)' },
    { id: 'performance', label: 'Desempenho & Jobs' },
    { id: 'backup', label: 'Backup & Continuidade' },
    { id: 'testesAceitacao', label: 'Testes de Aceitação (E2E)' },
    { id: 'seguranca', label: 'Segurança & Hardening LGPD' },
    { id: 'observabilidade', label: 'Observabilidade & Suporte' },
    { id: 'uxPadronizacao', label: 'UX & Padronização' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Header Fixo de Governança e Empresa Ativa */}
      <header className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 px-2 py-1 rounded uppercase font-extrabold text-xs tracking-wider shadow-xs">
            Nexus
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">ERP Industrial Multiempresa</h1>
            <p className="text-[11px] text-slate-400">Grupo TRITECH • 5 CNPJs com Isolamento Seguro</p>
          </div>
        </div>

        {/* Seletor de Empresa Ativa */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium hidden md:inline">Empresa Ativa:</span>
          <select 
            className="bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto cursor-pointer"
            value={empresaAtiva.id}
            onChange={(e) => handleEmpresaChange(e.target.value)}
          >
            {EMPRESAS_GRUPO.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nomeFantasia} ({emp.codigo}) - {emp.cnpj}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Menu Superior de Abas (Com Rolagem Horizontal Fluida) */}
      <nav 
        id="nexus-tab-navigation"
        aria-label="Navegação dos Módulos NEXUS" 
        className="bg-white border-b border-slate-200 px-4 py-2.5 flex gap-1.5 overflow-x-auto shadow-2xs sticky top-[69px] z-40 scrollbar-thin scrollbar-thumb-slate-300"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-button-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap border cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Conteúdo Principal com Renderização Dinâmica */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full h-full">
        {activeTab === 'auditoria' && <AuditoriaViewer empresaAtiva={empresaAtiva} />}
        {activeTab === 'notificacoes' && <NotificacoesViewer />}
        {activeTab === 'relatorios' && <RelatoriosViewer />}
        {activeTab === 'comercial' && <OrcamentoViewer empresaAtiva={empresaAtiva} />}
        {activeTab === 'suprimentos' && <ComprasViewer empresaAtiva={empresaAtiva} />}
        {activeTab === 'estoque' && <EstoqueViewer empresaAtiva={empresaAtiva} />}
        {activeTab === 'chaoFabrica' && <ProducaoViewer empresaId={empresaAtiva.id} />}
        {activeTab === 'qualidade' && <QualidadeViewer empresaAtiva={empresaAtiva} />}
        {activeTab === 'expedicaoFiscal' && <FiscalViewer empresaAtiva={empresaAtiva} />}
        {activeTab === 'financeiro' && <FinanceiroViewer empresaAtiva={empresaAtiva} />}
        {activeTab === 'tritechAi' && <TritechAiBridgeViewer />}
        {activeTab === 'performance' && <PerformanceJobsViewer />}
        {activeTab === 'backup' && <BackupRecoveryViewer />}
        {activeTab === 'testesAceitacao' && <AcceptanceTestsViewer />}
        {activeTab === 'seguranca' && <SecurityHardeningViewer />}
        {activeTab === 'observabilidade' && <ObservabilidadeViewer />}
        {activeTab === 'uxPadronizacao' && <UxStandardizationViewer />}
      </main>

    </div>
  );
}