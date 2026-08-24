'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Building,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  KeyRound,
  LogIn,
  Crown,
} from 'lucide-react';
import { UsuarioRecord, EmpresaRecord, PerfilRecord } from '../../../backend/modules/multi-tenant/types';

interface UserManagementViewerProps {
  onSimulateLogin?: (userId: string) => void;
  currentActiveUserId?: string;
}

export function UserManagementViewer({ onSimulateLogin, currentActiveUserId }: UserManagementViewerProps) {
  const [users, setUsers] = useState<UsuarioRecord[]>([]);
  const [companies, setCompanies] = useState<EmpresaRecord[]>([]);
  const [perfis, setPerfis] = useState<PerfilRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    cargo: '',
    isSuperAdmin: false,
    selectedCompanyId: '',
    selectedPerfilId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes, pRes] = await Promise.all([
        fetch('/api/v1/admin/usuarios?limit=100'),
        fetch('/api/v1/admin/empresas?limit=100'),
        fetch('/api/v1/admin/perfis'),
      ]);

      const [uData, cData, pData] = await Promise.all([uRes.json(), cRes.json(), pRes.json()]);

      if (uData.success && uData.items) setUsers(uData.items);
      if (cData.success && cData.items) {
        setCompanies(cData.items);
        if (cData.items.length > 0 && !formData.selectedCompanyId) {
          setFormData((prev) => ({ ...prev, selectedCompanyId: cData.items[0].id }));
        }
      }
      if (pData.success && pData.data?.perfis) {
        setPerfis(pData.data.perfis);
        if (pData.data.perfis.length > 0 && !formData.selectedPerfilId) {
          setFormData((prev) => ({ ...prev, selectedPerfilId: pData.data.perfis[0].id }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [uRes, cRes, pRes] = await Promise.all([
          fetch('/api/v1/admin/usuarios?limit=100'),
          fetch('/api/v1/admin/empresas?limit=100'),
          fetch('/api/v1/admin/perfis'),
        ]);
        const uData = await uRes.json();
        const cData = await cRes.json();
        const pData = await pRes.json();

        if (!ignore) {
          if (uData.success && uData.items) setUsers(uData.items);
          if (cData.success && cData.items) {
            setCompanies(cData.items);
            if (cData.items.length > 0) {
              setFormData((prev) => (prev.selectedCompanyId ? prev : { ...prev, selectedCompanyId: cData.items[0].id }));
            }
          }
          if (pData.success && pData.data?.perfis) {
            setPerfis(pData.data.perfis);
            if (pData.data.perfis.length > 0) {
              setFormData((prev) => (prev.selectedPerfilId ? prev : { ...prev, selectedPerfilId: pData.data.perfis[0].id }));
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados de usuários:', err);
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
      const res = await fetch(`/api/v1/admin/usuarios/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Status de '${name}' alterado com sucesso.` });
        fetchData();
      } else {
        setStatusMessage({ type: 'error', text: data.error?.message || 'Falha ao alterar status.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro de conexão.' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const payload = {
      nome: formData.nome,
      email: formData.email,
      cpf: formData.cpf,
      cargo: formData.cargo,
      isSuperAdmin: formData.isSuperAdmin,
      empresasVinculadas: formData.selectedCompanyId
        ? [
            {
              empresaId: formData.selectedCompanyId,
              perfilId: formData.selectedPerfilId,
              padrao: true,
            },
          ]
        : [],
    };

    try {
      const res = await fetch('/api/v1/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setShowModal(false);
        setFormData({
          nome: '',
          email: '',
          cpf: '',
          cargo: '',
          isSuperAdmin: false,
          selectedCompanyId: companies[0]?.id || '',
          selectedPerfilId: perfis[0]?.id || '',
        });
        fetchData();
      } else {
        setStatusMessage({ type: 'error', text: data.error?.message || 'Falha ao cadastrar usuário.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro de conexão.' });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.cargo && u.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div id="user-management-viewer" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm tracking-wide">
            <Users className="w-5 h-5" />
            <span>SEGURANÇA & CONTROLE DE ACESSO (RBAC)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Gestão de Usuários & Vínculos Multiempresa</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Definição de permissões, perfis corporativos e mapeamento estrito de empresas autorizadas por usuário.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
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

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar usuário por nome, e-mail ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredUsers.map((user) => {
          const isCurrentActive = currentActiveUserId === user.id;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isCurrentActive
                  ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100 text-base">{user.nome}</h3>
                        {user.isSuperAdmin && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                            <Crown className="w-3 h-3 text-amber-400" />
                            SuperAdmin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      user.ativo
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80 mb-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cargo / Função:</span>
                    <span className="font-medium text-slate-200">{user.cargo || 'Não especificado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">CPF:</span>
                    <span className="font-mono text-slate-300">{user.cpf || 'Não informado'}</span>
                  </div>
                </div>

                {/* Empresas Vinculadas */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Empresas Autorizadas ({user.isSuperAdmin ? 'Todas as Unidades do Grupo' : user.empresasVinculadas.length}):
                  </span>

                  {user.isSuperAdmin ? (
                    <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-xs flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span>Acesso Global IRRESTRITO a todas as 5 empresas do grupo industrial.</span>
                    </div>
                  ) : user.empresasVinculadas.length === 0 ? (
                    <div className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
                      Nenhuma empresa vinculada (Acesso bloqueado).
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {user.empresasVinculadas.map((binding, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-medium text-slate-200">
                              {binding.empresaNomeFantasia || binding.empresaId.substring(0, 8)}
                            </span>
                            {binding.padrao && (
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                                Padrão
                              </span>
                            )}
                          </div>
                          <span className="text-indigo-300 text-[11px] font-mono">
                            {binding.perfilNome || 'Perfil Atribuído'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(user.id, user.nome)}
                  className="text-xs text-slate-400 hover:text-rose-300 transition-colors"
                >
                  {user.ativo ? 'Desativar Usuário' : 'Reativar Usuário'}
                </button>

                {onSimulateLogin && (
                  <button
                    onClick={() => onSimulateLogin(user.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isCurrentActive
                        ? 'bg-emerald-600 text-white shadow-xs cursor-default'
                        : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isCurrentActive ? 'Sessão Atual Ativa' : 'Simular Login como Usuário'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação de Usuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-lg">Cadastrar Novo Usuário</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Carlos Mendonça"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@empresa.com.br"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ex: Supervisor de PCP / Engenheiro"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSuperAdminForm"
                  checked={formData.isSuperAdmin}
                  onChange={(e) => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <label htmlFor="isSuperAdminForm" className="text-xs text-amber-300 font-medium select-none">
                  Definir como SuperAdministrador (Acesso a todo o Grupo)
                </label>
              </div>

              {!formData.isSuperAdmin && (
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">Vínculo Inicial de Empresa & Perfil:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Empresa</label>
                      <select
                        value={formData.selectedCompanyId}
                        onChange={(e) => setFormData({ ...formData, selectedCompanyId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nomeFantasia} ({c.codigo})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Perfil de Permissão</label>
                      <select
                        value={formData.selectedPerfilId}
                        onChange={(e) => setFormData({ ...formData, selectedPerfilId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      >
                        {perfis.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

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
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
