'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowRightLeft,
  Building,
  FileText,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react';
import { EmpresaRecord, RegimeTributario } from '../../../backend/modules/multi-tenant/types';
import { formatCnpj, isValidCnpj } from '../../../backend/modules/multi-tenant/cnpj-validator';

export function CompanyManagementViewer() {
  const [companies, setCompanies] = useState<EmpresaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegime, setSelectedRegime] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    codigo: '',
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    regimeTributario: 'LUCRO_REAL' as RegimeTributario,
    ramoAtividade: '',
    isMatriz: false,
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/empresas?limit=100');
      const data = await res.json();
      if (data.success && data.items) {
        setCompanies(data.items);
      }
    } catch (err) {
      console.error('Falha ao carregar empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/v1/admin/empresas?limit=100');
        const data = await res.json();
        if (!ignore && data.success && data.items) {
          setCompanies(data.items);
        }
      } catch (err) {
        console.error('Falha ao carregar empresas:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/v1/admin/empresas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Status de '${name}' alterado com sucesso.` });
        fetchCompanies();
      } else {
        setStatusMessage({ type: 'error', text: data.error?.message || 'Falha ao alterar status.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro de conexão.' });
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validação frontend prévia
    if (!isValidCnpj(formData.cnpj)) {
      setStatusMessage({ type: 'error', text: 'CNPJ inválido de acordo com a validação oficial Módulo 11.' });
      return;
    }

    try {
      const res = await fetch('/api/v1/admin/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setShowModal(false);
        setFormData({
          codigo: '',
          razaoSocial: '',
          nomeFantasia: '',
          cnpj: '',
          inscricaoEstadual: '',
          inscricaoMunicipal: '',
          regimeTributario: 'LUCRO_REAL',
          ramoAtividade: '',
          isMatriz: false,
        });
        fetchCompanies();
      } else {
        setStatusMessage({ type: 'error', text: data.error?.message || 'Falha ao criar empresa.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao comunicar com o servidor.' });
    }
  };

  const filtered = companies.filter((comp) => {
    const matchesSearch =
      comp.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.cnpj.includes(searchTerm);

    const matchesRegime = selectedRegime === 'ALL' || comp.regimeTributario === selectedRegime;

    return matchesSearch && matchesRegime;
  });

  return (
    <div id="company-management-viewer" className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm tracking-wide">
            <Building2 className="w-5 h-5" />
            <span>NÚCLEO MULTIEMPRESA & TENANTS</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Gestão de Empresas & CNPJs do Grupo</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Controle centralizado das 5 unidades industriais e provisionamento de novos CNPJs com validação Módulo 11.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCompanies}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Empresa</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            )}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-75 hover:opacity-100 underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nome Fantasia, Razão Social, Código ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedRegime}
            onChange={(e) => setSelectedRegime(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Todos os Regimes Tributários</option>
            <option value="LUCRO_REAL">Lucro Real</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((company) => (
          <div
            key={company.id}
            className={`flex flex-col justify-between p-5 rounded-xl border transition-all ${
              company.ativo
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/60 border-slate-800/60 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                    {company.codigo}
                  </span>
                  {company.isMatriz && (
                    <span className="ml-2 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                      Matriz
                    </span>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    company.ativo
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {company.ativo ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Ativa
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Inativa
                    </>
                  )}
                </span>
              </div>

              <h3 className="font-bold text-slate-100 text-base leading-snug">{company.nomeFantasia}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{company.razaoSocial}</p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">CNPJ:</span>
                  <span className="font-mono font-medium text-slate-200">{company.cnpj}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Regime:</span>
                  <span className="font-medium text-slate-200">{company.regimeTributario.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Inscrição Est.:</span>
                  <span className="font-mono text-slate-300">{company.inscricaoEstadual || 'Isento'}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-0.5">Ramo de Atividade:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{company.ramoAtividade}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">ID: {company.id.substring(0, 8)}...</span>
              <button
                onClick={() => handleToggleStatus(company.id, company.nomeFantasia)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  company.ativo
                    ? 'text-rose-300 hover:bg-rose-950/50'
                    : 'text-emerald-300 hover:bg-emerald-950/50'
                }`}
              >
                {company.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro de Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-lg">Nova Empresa / CNPJ</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Código (Ex: TRITECH_SUL)</label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="TRITECH_SUL"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono uppercase text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Regime Tributário</label>
                  <select
                    value={formData.regimeTributario}
                    onChange={(e) =>
                      setFormData({ ...formData, regimeTributario: e.target.value as RegimeTributario })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="LUCRO_REAL">Lucro Real</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                    <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  required
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  placeholder="Ex: Tritech Estruturas Sul"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Razão Social</label>
                <input
                  type="text"
                  required
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                  placeholder="Ex: Tritech Estruturas Metálicas do Sul Ltda"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CNPJ (Módulo 11)</label>
                  <input
                    type="text"
                    required
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={formData.inscricaoEstadual}
                    onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                    placeholder="000.000.000.00-00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ramo de Atividade</label>
                <textarea
                  rows={2}
                  required
                  value={formData.ramoAtividade}
                  onChange={(e) => setFormData({ ...formData, ramoAtividade: e.target.value })}
                  placeholder="Descrição da atividade industrial ou comercial..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isMatriz"
                  checked={formData.isMatriz}
                  onChange={(e) => setFormData({ ...formData, isMatriz: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <label htmlFor="isMatriz" className="text-xs text-slate-300 select-none">
                  Definir como Empresa Matriz do Grupo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  Salvar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
