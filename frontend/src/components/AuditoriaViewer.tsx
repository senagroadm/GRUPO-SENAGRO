import React, { useState } from 'react';
import { Search, Download, Filter, ShieldCheck, ArrowRightLeft, FileText, Settings, UserCheck } from 'lucide-react';

// Dados estáticos avançados baseados no seu prompt
const mockAuditLogs = [
  { id: 'LOG-001', data: '27/08/2026 08:30:12', usuario: 'João Silva', empresa: 'MWAM Engenharia', modulo: 'Acesso', acao: 'login', entidade: 'Sessão', ip: '192.168.1.45', detalhes: 'Login bem-sucedido' },
  { id: 'LOG-002', data: '27/08/2026 08:35:44', usuario: 'Maria Oliveira', empresa: 'MWAM Engenharia', modulo: 'Vendas', acao: 'preço/desconto', entidade: 'Pedido #4492', ip: '192.168.1.102', detalhes: 'De: R$ 5.000 (0%) | Para: R$ 4.500 (10%)' },
  { id: 'LOG-003', data: '27/08/2026 08:40:05', usuario: 'Carlos Mendes', empresa: 'Grupo TRITECH', modulo: 'Sistema', acao: 'troca de empresa', entidade: 'Sessão', ip: '177.45.22.10', detalhes: 'Mudou de TRITECH para MWAM' },
  { id: 'LOG-004', data: '27/08/2026 09:12:30', usuario: 'Ana Costa', empresa: 'MWAM Engenharia', modulo: 'Suprimentos', acao: 'aprovação', entidade: 'Ordem de Compra #102', ip: '10.0.0.5', detalhes: 'Status: Pendente -> Aprovado' },
  { id: 'LOG-005', data: '27/08/2026 09:45:11', usuario: 'Roberto Almeida', empresa: 'MWAM Engenharia', modulo: 'Estoque', acao: 'ajuste de estoque', entidade: 'Item SKU-899', ip: '192.168.1.55', detalhes: 'Qtd Anterior: 50 | Qtd Atual: 48' },
  { id: 'LOG-006', data: '27/08/2026 10:05:22', usuario: 'Admin Sistema', empresa: 'MWAM Engenharia', modulo: 'Segurança', acao: 'alteração de permissões', entidade: 'Perfil: Vendedor', ip: '127.0.0.1', detalhes: 'Adicionada flag: CAN_GIVE_DISCOUNT' },
];

export function AuditoriaViewer({ empresaAtiva }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('Todas');

  const nomeEmpresa = typeof empresaAtiva === 'object' && empresaAtiva !== null
    ? (empresaAtiva.nome || empresaAtiva.razaoSocial || 'Unidade Selecionada')
    : (empresaAtiva || 'Todas as Empresas');

  // Lógica de Filtro
  const logsFiltrados = mockAuditLogs.filter(log => {
    const matchSearch = log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        log.entidade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAcao = filtroAcao === 'Todas' || log.acao === filtroAcao;
    return matchSearch && matchAcao;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header e Exportação */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Auditoria Transversal
          </h2>
          <p className="text-sm text-slate-500">
            Monitoramento de ações críticas para: <span className="font-medium text-slate-700">{nomeEmpresa}</span>
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-md transition-colors">
          <Download className="w-4 h-4" />
          Exportar Relatório (CSV)
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por usuário, pedido ou entidade..." 
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            className="text-sm border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
          >
            <option value="Todas">Todas as Ações Críticas</option>
            <option value="login">Login / Acessos</option>
            <option value="troca de empresa">Troca de Empresa</option>
            <option value="preço/desconto">Alteração de Preço/Desconto</option>
            <option value="aprovação">Aprovações</option>
            <option value="ajuste de estoque">Ajustes de Estoque</option>
            <option value="alteração de permissões">Alteração de Permissões</option>
          </select>
        </div>
      </div>
      
      {/* Tabela de Dados */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Módulo / Ação</th>
              <th className="px-4 py-3">Entidade Afetada (Before/After)</th>
              <th className="px-4 py-3">IP Origem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logsFiltrados.length > 0 ? (
              logsFiltrados.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                    <span className="block text-slate-700 font-medium">{log.data.split(' ')[0]}</span>
                    {log.data.split(' ')[1]}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-700">{log.usuario}</span>
                    <span className="block text-xs text-slate-400">{log.empresa}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 mb-1">
                      {log.modulo}
                    </span>
                    <span className="block font-medium text-indigo-600 uppercase text-[10px] tracking-wider">
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-700 block mb-1">{log.entidade}</span>
                    <span className="text-xs text-slate-500">{log.detalhes}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{log.ip}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}