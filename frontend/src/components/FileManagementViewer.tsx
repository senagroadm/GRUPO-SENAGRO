'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Download,
  Eye,
  History,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCheck,
  RefreshCw,
  FolderLock,
  Layers,
  Sparkles,
  ExternalLink,
  Trash2,
  Info,
  Lock,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';

interface ArquivoItem {
  id: string;
  empresaId: string;
  modulo: string;
  entidadeTipo: string;
  entidadeId: string;
  nomeOriginal: string;
  nomeArmazenado: string;
  storagePath: string;
  storageProvider: string;
  mimeType: string;
  tamanhoBytes: number;
  hashSha256: string;
  versao: number;
  documentoOrigemId?: string | null;
  isVersaoAtual: boolean;
  categoria: string;
  descricao?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

interface ArquivoLog {
  id: string;
  arquivoId: string;
  empresaId: string;
  tipoEvento: 'UPLOAD' | 'DOWNLOAD' | 'PREVIEW' | 'DELETE' | 'NEW_VERSION';
  ipOrigem?: string;
  userAgent?: string;
  detalhes?: any;
  criadoEm: string;
}

export function FileManagementViewer({ empresaAtiva }: { empresaAtiva: Empresa }) {
  const [arquivos, setArquivos] = useState<ArquivoItem[]>([]);
  const [logs, setLogs] = useState<ArquivoLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModulo, setSelectedModulo] = useState<string>('TODOS');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModulo, setUploadModulo] = useState('CRM');
  const [uploadEntidadeTipo, setUploadEntidadeTipo] = useState('OPORTUNIDADE');
  const [uploadEntidadeId, setUploadEntidadeId] = useState('opt-001');
  const [uploadCategoria, setUploadCategoria] = useState('PROPOSTA');
  const [uploadDescricao, setUploadDescricao] = useState('');
  const [uploadFileContent, setUploadFileContent] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadMimeType, setUploadMimeType] = useState('application/pdf');

  // Preview modal state
  const [previewArquivo, setPreviewArquivo] = useState<ArquivoItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Version modal state
  const [versionTarget, setVersionTarget] = useState<ArquivoItem | null>(null);
  const [versionDesc, setVersionDesc] = useState('');
  const [versionContent, setVersionContent] = useState('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'arquivos' | 'auditoria' | 'arquitetura'>('arquivos');

  const fetchArquivos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('empresaId', empresaAtiva.id);
      if (selectedModulo !== 'TODOS') params.append('modulo', selectedModulo);
      if (selectedCategoria !== 'TODAS') params.append('categoria', selectedCategoria);
      if (searchTerm) params.append('busca', searchTerm);

      const res = await fetch(`/api/v1/arquivos?${params.toString()}`, {
        headers: { 'x-empresa-id': empresaAtiva.id },
      });
      const data = await res.json();
      if (data.success) {
        setArquivos(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar arquivos:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id, selectedModulo, selectedCategoria, searchTerm]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/arquivos/logs?empresaId=${empresaAtiva.id}`, {
        headers: { 'x-empresa-id': empresaAtiva.id },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) {
        await fetchArquivos();
        await fetchLogs();
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchArquivos, fetchLogs]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) return;

    try {
      const res = await fetch('/api/v1/arquivos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaAtiva.id,
        },
        body: JSON.stringify({
          nomeOriginal: uploadFileName,
          modulo: uploadModulo,
          entidadeTipo: uploadEntidadeTipo,
          entidadeId: uploadEntidadeId,
          categoria: uploadCategoria,
          descricao: uploadDescricao,
          mimeType: uploadMimeType,
          content: uploadFileContent || `Conteúdo industrial gerado para ${uploadFileName} em ${new Date().toISOString()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowUploadModal(false);
        setUploadFileName('');
        setUploadDescricao('');
        setUploadFileContent('');
        fetchArquivos();
        fetchLogs();
      }
    } catch (err) {
      console.error('Erro ao realizar upload:', err);
    }
  };

  const handleCreateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTarget) return;

    try {
      const res = await fetch(`/api/v1/arquivos/${versionTarget.id}/versao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaAtiva.id,
        },
        body: JSON.stringify({
          nomeOriginal: versionTarget.nomeOriginal,
          descricao: versionDesc || `Revisão técnica de engenharia v${versionTarget.versao + 1}`,
          content: versionContent || `Conteúdo revisado da versão ${versionTarget.versao + 1} de ${versionTarget.nomeOriginal}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVersionTarget(null);
        setVersionDesc('');
        setVersionContent('');
        fetchArquivos();
        fetchLogs();
      }
    } catch (err) {
      console.error('Erro ao criar versão:', err);
    }
  };

  const handleOpenPreview = async (arquivo: ArquivoItem) => {
    setPreviewArquivo(arquivo);
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/v1/arquivos/${arquivo.id}/preview?format=json`, {
        headers: { 'x-empresa-id': empresaAtiva.id },
      });
      const data = await res.json();
      if (data.success) {
        setPreviewContent(data.data.previewText || `Visualização do arquivo ${arquivo.nomeOriginal}`);
      }
    } catch (err) {
      console.error('Erro ao carregar preview:', err);
      setPreviewContent('Não foi possível gerar a pré-visualização inline.');
    } finally {
      setPreviewLoading(false);
      fetchLogs();
    }
  };

  const handleDownload = async (arquivo: ArquivoItem) => {
    window.open(`/api/v1/arquivos/${arquivo.id}/download`, '_blank');
    setTimeout(() => fetchLogs(), 1000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryBadge = (categoria: string) => {
    switch (categoria) {
      case 'PROPOSTA':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-700 border border-purple-200">Proposta Comercial</span>;
      case 'DESENHO_TECNICO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 border border-blue-200">CAD / DXF</span>;
      case 'XML_FISCAL':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 border border-emerald-200">XML NF-e</span>;
      case 'CERTIFICADO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-700 border border-amber-200">Certificado Usina</span>;
      case 'COMPROVANTE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-100 text-cyan-700 border border-cyan-200">Comprovante</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">{categoria}</span>;
    }
  };

  const getFileIcon = (mime: string, nome: string) => {
    if (mime.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
    if (mime.includes('image')) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    if (mime.includes('xml') || nome.endsWith('.xml')) return <FileCode className="w-5 h-5 text-amber-500" />;
    if (nome.endsWith('.dxf') || nome.endsWith('.dwg')) return <Layers className="w-5 h-5 text-blue-600" />;
    return <FileCheck className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div id="file-management-viewer" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <FolderLock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Módulo de Arquivos & Storage de Objetos</h2>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  Desacoplado do PostgreSQL
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Storage de documentos polimórficos, hash SHA-256 imutável, versionamento CAD/DXF e trilha de downloads para{' '}
                <span className="font-semibold text-slate-700">{empresaAtiva.nomeFantasia}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchArquivos();
                fetchLogs();
              }}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Novo Upload de Arquivo
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 border-b border-slate-200 mt-6 pt-2">
          <button
            onClick={() => setActiveTab('arquivos')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'arquivos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentos Armazenados ({arquivos.length})
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'auditoria'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Trilha de Auditoria & Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('arquitetura')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'arquitetura'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Info className="w-4 h-4" />
            Regras de Storage & MIME Suportados
          </button>
        </div>
      </div>

      {activeTab === 'arquivos' && (
        <>
          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, hash ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={selectedModulo}
                onChange={(e) => setSelectedModulo(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="TODOS">Todos os Módulos</option>
                <option value="CRM">CRM & Propostas</option>
                <option value="ENGENHARIA">Engenharia (CAD/DXF)</option>
                <option value="FISCAL">Fiscal (XML NFe)</option>
                <option value="QUALIDADE">Qualidade & Usina</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="GERAL">Geral</option>
              </select>

              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="TODAS">Todas as Categorias</option>
                <option value="PROPOSTA">Propostas Comerciais</option>
                <option value="DESENHO_TECNICO">Desenhos Técnicos (DXF/DWG)</option>
                <option value="XML_FISCAL">XMLs Fiscais</option>
                <option value="CERTIFICADO">Certificados de Usina</option>
                <option value="COMPROVANTE">Comprovantes Financeiros</option>
                <option value="MANUAL">Manuais Técnicos</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Exibindo <span className="font-bold text-slate-800">{arquivos.length}</span> arquivos com isolamento em{' '}
              <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{empresaAtiva.codigo}</span>
            </div>
          </div>

          {/* Files List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-500 mb-2" />
                <p className="text-sm font-medium">Carregando catálogo de arquivos...</p>
              </div>
            ) : arquivos.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FolderLock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-base font-semibold text-slate-800">Nenhum arquivo encontrado</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Não foram localizados documentos para os filtros selecionados ou empresa ativa.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  Fazer primeiro upload
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Documento & Categoria</th>
                      <th className="px-6 py-3.5">Vínculo Polimórfico</th>
                      <th className="px-6 py-3.5">Tamanho & Versão</th>
                      <th className="px-6 py-3.5">Hash SHA-256</th>
                      <th className="px-6 py-3.5">Data de Upload</th>
                      <th className="px-6 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {arquivos.map((arquivo) => (
                      <tr key={arquivo.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 mt-0.5">
                              {getFileIcon(arquivo.mimeType, arquivo.nomeOriginal)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                <span>{arquivo.nomeOriginal}</span>
                                {getCategoryBadge(arquivo.categoria)}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {arquivo.descricao || 'Sem descrição cadastrada'}
                              </p>
                              <span className="text-[11px] font-mono text-slate-400">
                                MIME: {arquivo.mimeType}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {arquivo.modulo}
                            </span>
                            <div className="text-xs text-slate-600">
                              <span className="font-mono text-slate-400">{arquivo.entidadeTipo}:</span>{' '}
                              <span className="font-semibold">{arquivo.entidadeId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{formatBytes(arquivo.tamanhoBytes)}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              v{arquivo.versao}
                            </span>
                            {arquivo.isVersaoAtual && (
                              <span className="text-[10px] text-slate-400 font-medium">(Atual)</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 truncate max-w-[140px]" title={arquivo.hashSha256}>
                              {arquivo.hashSha256.substring(0, 12)}...
                            </span>
                            <button
                              onClick={() => handleCopyHash(arquivo.hashSha256)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                              title="Copiar Hash SHA-256 completo"
                            >
                              {copiedHash === arquivo.hashSha256 ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(arquivo.criadoEm).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPreview(arquivo)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Pré-visualizar documento"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(arquivo)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Download autenticado com log"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setVersionTarget(arquivo);
                                setVersionDesc(`Revisão técnica de engenharia v${arquivo.versao + 1}`);
                              }}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Criar nova versão deste arquivo"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Auditoria & Logs Tab */}
      {activeTab === 'auditoria' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Trilha de Auditoria de Arquivos (Append-Only)</h3>
              <p className="text-xs text-slate-500">
                Registro imutável de todas as operações de upload, download, preview e versionamento.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recarregar Logs
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-4 py-3">Tipo do Evento</th>
                  <th className="px-4 py-3">Arquivo ID</th>
                  <th className="px-4 py-3">IP Origem</th>
                  <th className="px-4 py-3">Detalhes Técnicos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Nenhum registro de log encontrado.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(log.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            log.tipoEvento === 'UPLOAD'
                              ? 'bg-blue-100 text-blue-800'
                              : log.tipoEvento === 'DOWNLOAD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.tipoEvento === 'PREVIEW'
                              ? 'bg-purple-100 text-purple-800'
                              : log.tipoEvento === 'NEW_VERSION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.tipoEvento}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{log.arquivoId}</td>
                      <td className="px-4 py-2.5 text-slate-500">{log.ipOrigem || '127.0.0.1'}</td>
                      <td className="px-4 py-2.5 text-slate-600 truncate max-w-xs">
                        {JSON.stringify(log.detalhes || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Arquitetura & MIME Tab */}
      {activeTab === 'arquitetura' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Diretrizes do Storage de Objetos do ERP Industrial</h3>
            <p className="text-sm text-slate-500 mt-1">
              Conformidade rigorosa com os requisitos de isolamento multiempresa e segurança documental.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Desacoplamento do PostgreSQL
              </div>
              <p className="text-xs text-slate-600">
                Binários nunca são salvos em campos <code className="text-rose-600">bytea</code> do banco. O PostgreSQL armazena apenas metadados, hash SHA-256 e vínculos polimórficos.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <History className="w-4 h-4 text-indigo-600" />
                Versionamento de Engenharia
              </div>
              <p className="text-xs text-slate-600">
                Desenhos DXF/DWG e propostas comerciais suportam cadeia de versões (v1, v2, v3) com preservação histórica e rastreabilidade total.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <Lock className="w-4 h-4 text-amber-600" />
                Downloads Autenticados
              </div>
              <p className="text-xs text-slate-600">
                Nenhum arquivo possui URL pública estática. Todo acesso valida a sessão, empresa ativa e gera log de auditoria com IP e timestamp.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase font-bold text-slate-500 mb-3">Formatos & Extensões Suportadas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="font-bold text-rose-900 block">PDF (Propostas & Manuais)</span>
                <span className="text-rose-700 text-[11px]">application/pdf (Preview Inline)</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-bold text-blue-900 block">DXF / DWG (CAD 2D/3D)</span>
                <span className="text-blue-700 text-[11px]">application/dxf (Metadados Técnicos)</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="font-bold text-amber-900 block">XML (NF-e, CT-e, MDF-e)</span>
                <span className="text-amber-700 text-[11px]">application/xml (Validação SEFAZ)</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="font-bold text-emerald-900 block">Imagens (PNG, JPG, WebP)</span>
                <span className="text-emerald-700 text-[11px]">image/* (Comprovantes / Fotos)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Upload de Documento no Storage</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Arquivo com Extensão</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Proposta_Comercial_Tanques_v1.pdf ou Desenho_Laser.dxf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Módulo Vinculado</label>
                  <select
                    value={uploadModulo}
                    onChange={(e) => setUploadModulo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="CRM">CRM</option>
                    <option value="ENGENHARIA">ENGENHARIA</option>
                    <option value="FISCAL">FISCAL</option>
                    <option value="QUALIDADE">QUALIDADE</option>
                    <option value="FINANCEIRO">FINANCEIRO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria do Arquivo</label>
                  <select
                    value={uploadCategoria}
                    onChange={(e) => setUploadCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="PROPOSTA">Proposta Comercial</option>
                    <option value="DESENHO_TECNICO">Desenho Técnico (CAD/DXF)</option>
                    <option value="XML_FISCAL">XML Fiscal</option>
                    <option value="CERTIFICADO">Certificado de Usina</option>
                    <option value="COMPROVANTE">Comprovante Financeiro</option>
                    <option value="MANUAL">Manual Técnico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entidade Tipo (Polimórfico)</label>
                  <input
                    type="text"
                    value={uploadEntidadeTipo}
                    onChange={(e) => setUploadEntidadeTipo(e.target.value)}
                    placeholder="OPORTUNIDADE, PROJETO, NFE..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entidade ID Vinculada</label>
                  <input
                    type="text"
                    value={uploadEntidadeId}
                    onChange={(e) => setUploadEntidadeId(e.target.value)}
                    placeholder="Ex: opt-001"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Finalidade</label>
                <textarea
                  rows={2}
                  value={uploadDescricao}
                  onChange={(e) => setUploadDescricao(e.target.value)}
                  placeholder="Descreva a finalidade técnica ou comercial deste documento..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Conteúdo / Texto Simulado do Arquivo</label>
                <textarea
                  rows={3}
                  value={uploadFileContent}
                  onChange={(e) => setUploadFileContent(e.target.value)}
                  placeholder="Insira o texto técnico, XML ou cabeçalho CAD para cálculo do SHA-256..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors"
                >
                  Confirmar & Calcular SHA-256
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Versioning Modal */}
      {versionTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Nova Versão Documental</h3>
              </div>
              <button
                onClick={() => setVersionTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
              <p className="font-semibold">Documento Base: {versionTarget.nomeOriginal}</p>
              <p className="mt-0.5">Versão Atual: v{versionTarget.versao} → Nova Versão: <strong>v{versionTarget.versao + 1}</strong></p>
            </div>

            <form onSubmit={handleCreateNewVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Descrição da Revisão</label>
                <textarea
                  rows={2}
                  required
                  value={versionDesc}
                  onChange={(e) => setVersionDesc(e.target.value)}
                  placeholder="Ex: Ajuste de tolerâncias dimensionais no raio de dobra de 12mm..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Conteúdo Atualizado da Nova Versão</label>
                <textarea
                  rows={4}
                  value={versionContent}
                  onChange={(e) => setVersionContent(e.target.value)}
                  placeholder="Conteúdo técnico atualizado para a versão revisada..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVersionTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors"
                >
                  Salvar Revisão v{versionTarget.versao + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewArquivo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{previewArquivo.nomeOriginal}</h3>
                  <span className="text-xs text-slate-500 font-mono">
                    SHA-256: {previewArquivo.hashSha256.substring(0, 16)}... | v{previewArquivo.versao}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewArquivo(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs border border-slate-800">
              {previewLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                  Carregando visualização inline...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{previewContent}</pre>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>{formatBytes(previewArquivo.tamanhoBytes)} • {previewArquivo.mimeType}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(previewArquivo)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => setPreviewArquivo(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
