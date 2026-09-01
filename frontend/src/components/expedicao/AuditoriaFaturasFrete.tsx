'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  AlertCircle,
  TrendingDown,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Receipt,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Filter,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Empresa } from '@/backend/core/types/company';
import { Transportadora } from '@/backend/modules/expedicao/expedicao-types';

export interface ItemAuditoriaFatura {
  id: string;
  numeroConhecimentoCte: string;
  chaveAcessoCte: string;
  transportadoraId: string;
  transportadoraNome: string;
  cnpjTransportadora: string;
  dataEmissaoCte: string;
  numeroNotaFiscal: string;
  clienteDestinatario: string;
  cidadeUfDestino: string;
  pesoCobradoKg: number;
  pesoContratualKg: number;
  valorFreteCobradoCte: number;
  valorFreteContratualCalculado: number;
  divergenciaValor: number;
  divergenciaPercentual: number;
  statusAuditoria: 'APROVADO' | 'DIVERGENCIA_COBRANCA_INDEVIDA' | 'DIVERGENCIA_PESO' | 'EM_ANALISE';
  motivoDivergencia?: string;
  glosaAceita?: boolean;
}

interface AuditoriaFaturasFreteProps {
  empresaAtiva: Empresa;
  transportadoras: Transportadora[];
}

const FATURAS_MOCK_INICIAIS: ItemAuditoriaFatura[] = [
  {
    id: 'FAT-001',
    numeroConhecimentoCte: 'CT-e 0048912',
    chaveAcessoCte: '35260812345678000190570010000489121000489128',
    transportadoraId: 'transp-001',
    transportadoraNome: 'Rodonaves Transportes Ltda',
    cnpjTransportadora: '44.914.992/0001-38',
    dataEmissaoCte: '2026-08-28',
    numeroNotaFiscal: 'NF-e 004921',
    clienteDestinatario: 'Agropecuária Vale do Paranapanema',
    cidadeUfDestino: 'Assis/SP',
    pesoCobradoKg: 420,
    pesoContratualKg: 420,
    valorFreteCobradoCte: 318.5,
    valorFreteContratualCalculado: 318.5,
    divergenciaValor: 0.0,
    divergenciaPercentual: 0.0,
    statusAuditoria: 'APROVADO',
  },
  {
    id: 'FAT-002',
    numeroConhecimentoCte: 'CT-e 0089123',
    chaveAcessoCte: '35260898765432000112570010000891231000891234',
    transportadoraId: 'transp-002',
    transportadoraNome: 'Braspress Transportes Urgentes',
    cnpjTransportadora: '48.740.351/0001-65',
    dataEmissaoCte: '2026-08-29',
    numeroNotaFiscal: 'NF-e 004922',
    clienteDestinatario: 'Distribuidora Central Sul Ltda',
    cidadeUfDestino: 'Curitiba/PR',
    pesoCobradoKg: 680,
    pesoContratualKg: 510,
    valorFreteCobradoCte: 585.0,
    valorFreteContratualCalculado: 442.5,
    divergenciaValor: 142.5,
    divergenciaPercentual: 32.2,
    statusAuditoria: 'DIVERGENCIA_PESO',
    motivoDivergencia: 'Peso cubado lançado no CT-e (680 kg) divergente do aferido na balança de expedição (510 kg).',
    glosaAceita: false,
  },
  {
    id: 'FAT-003',
    numeroConhecimentoCte: 'CT-e 0019283',
    chaveAcessoCte: '35260811223344000155570010000192831000192831',
    transportadoraId: 'transp-003',
    transportadoraNome: 'Jamef Encomendas Urgentes',
    cnpjTransportadora: '20.147.617/0001-30',
    dataEmissaoCte: '2026-08-30',
    numeroNotaFiscal: 'NF-e 004923',
    clienteDestinatario: 'Metalúrgica Triângulo Mineiro',
    cidadeUfDestino: 'Uberlândia/MG',
    pesoCobradoKg: 280,
    pesoContratualKg: 280,
    valorFreteCobradoCte: 340.0,
    valorFreteContratualCalculado: 275.0,
    divergenciaValor: 65.0,
    divergenciaPercentual: 23.6,
    statusAuditoria: 'DIVERGENCIA_COBRANCA_INDEVIDA',
    motivoDivergencia: 'Taxa de reentrega e descarga indevidamente inserida no CT-e sem autorização prévia.',
    glosaAceita: false,
  },
  {
    id: 'FAT-004',
    numeroConhecimentoCte: 'CT-e 0033419',
    chaveAcessoCte: '35260855443322000199570010000334191000334199',
    transportadoraId: 'transp-001',
    transportadoraNome: 'Rodonaves Transportes Ltda',
    cnpjTransportadora: '44.914.992/0001-38',
    dataEmissaoCte: '2026-08-31',
    numeroNotaFiscal: 'NF-e 004924',
    clienteDestinatario: 'Cooperativa Agrícola de Maringá',
    cidadeUfDestino: 'Maringá/PR',
    pesoCobradoKg: 950,
    pesoContratualKg: 950,
    valorFreteCobradoCte: 760.0,
    valorFreteContratualCalculado: 760.0,
    divergenciaValor: 0.0,
    divergenciaPercentual: 0.0,
    statusAuditoria: 'APROVADO',
  },
];

export function AuditoriaFaturasFrete({ empresaAtiva, transportadoras }: AuditoriaFaturasFreteProps) {
  const [faturas, setFaturas] = useState<ItemAuditoriaFatura[]>(FATURAS_MOCK_INICIAIS);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroTransportadora, setFiltroTransportadora] = useState<string>('TODAS');

  // Modal de Adicionar CT-e para Auditoria
  const [modalNovoCte, setModalNovoCte] = useState(false);
  const [novoCteNumero, setNovoCteNumero] = useState('');
  const [novoCteTranspId, setNovoCteTranspId] = useState(transportadoras[0]?.id || 'transp-001');
  const [novoCteNf, setNovoCteNf] = useState('');
  const [novoCtePesoCobrado, setNovoCtePesoCobrado] = useState(300);
  const [novoCtePesoContratual, setNovoCtePesoContratual] = useState(300);
  const [novoCteValorCobrado, setNovoCteValorCobrado] = useState(280);
  const [novoCteValorContratual, setNovoCteValorContratual] = useState(250);
  const [novoCteCliente, setNovoCteCliente] = useState('Indústria de Bebidas SP');
  const [novoCteDestino, setNovoCteDestino] = useState('Campinas/SP');

  // Métricas de Auditoria
  const totalAuditado = faturas.reduce((acc, f) => acc + f.valorFreteCobradoCte, 0);
  const totalContratual = faturas.reduce((acc, f) => acc + f.valorFreteContratualCalculado, 0);
  const totalDivergenciasCobrança = faturas
    .filter((f) => f.divergenciaValor > 0)
    .reduce((acc, f) => acc + f.divergenciaValor, 0);
  const totalGlosadoRecuperado = faturas
    .filter((f) => f.glosaAceita)
    .reduce((acc, f) => acc + f.divergenciaValor, 0);

  const faturasFiltradas = faturas.filter((f) => {
    if (filtroStatus !== 'TODOS' && f.statusAuditoria !== filtroStatus) return false;
    if (filtroTransportadora !== 'TODAS' && f.transportadoraId !== filtroTransportadora) return false;
    return true;
  });

  const aprovarFatura = (id: string) => {
    setFaturas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, statusAuditoria: 'APROVADO', divergenciaValor: 0 } : f))
    );
  };

  const aplicarGlosa = (id: string) => {
    setFaturas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, glosaAceita: true } : f))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Ações */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Auditoria de Faturas & Conciliação de CT-e (Pre-Billing)
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                Anti-Cobrança Indevida
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Cruza o valor dos Conhecimentos de Transporte Eletrônico (CT-e) recebidos contra as tabelas de frete contratadas e a cubagem real da expedição.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNovoCte(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Auditar Novo CT-e
        </button>
      </div>

      {/* KPI Cards de Auditoria & Glosas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total em Faturas CT-e</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            R$ {totalAuditado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Valor contratual previsto: <strong>R$ {totalContratual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Cobranças Divergentes</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            R$ {totalDivergenciasCobrança.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-rose-700 font-semibold border-t border-slate-100 pt-2">
            {faturas.filter((f) => f.divergenciaValor > 0).length} CT-es com cobrança indevida
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Glosas Recuperadas</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            R$ {totalGlosadoRecuperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Economia obtida por contestação de fatura
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Índice de Acuracidade</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700">
            {((faturas.filter((f) => f.statusAuditoria === 'APROVADO').length / faturas.length) * 100).toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Faturas 100% corretas no primeiro envio
          </div>
        </div>
      </div>

      {/* Tabela de Conciliação e Auditoria */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase">Filtros:</span>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="APROVADO">Aprovados (Conformes)</option>
              <option value="DIVERGENCIA_COBRANCA_INDEVIDA">Cobrança Indevida</option>
              <option value="DIVERGENCIA_PESO">Divergência de Peso/Cubagem</option>
            </select>

            <select
              value={filtroTransportadora}
              onChange={(e) => setFiltroTransportadora(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium"
            >
              <option value="TODAS">Todas Transportadoras</option>
              {transportadoras.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nomeFantasia}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Exibindo <strong>{faturasFiltradas.length}</strong> conhecimento(s) de transporte
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 font-bold">CT-e / Emissão</th>
                <th className="py-2.5 px-3 font-bold">Transportadora</th>
                <th className="py-2.5 px-3 font-bold">NF-e & Destinatário</th>
                <th className="py-2.5 px-3 font-bold text-center">Peso Cobrado x Real</th>
                <th className="py-2.5 px-3 font-bold text-right">Valor CT-e</th>
                <th className="py-2.5 px-3 font-bold text-right">Contratual</th>
                <th className="py-2.5 px-3 font-bold text-right">Divergência</th>
                <th className="py-2.5 px-3 font-bold text-center">Status</th>
                <th className="py-2.5 px-3 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {faturasFiltradas.map((f) => (
                <tr key={f.id} className={`hover:bg-slate-50 transition-colors ${f.divergenciaValor > 0 ? 'bg-rose-50/20' : ''}`}>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{f.numeroConhecimentoCte}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Emissão: {f.dataEmissaoCte}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{f.transportadoraNome}</div>
                    <div className="text-[10px] text-slate-400">CNPJ: {f.cnpjTransportadora}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{f.numeroNotaFiscal}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[180px]" title={f.clienteDestinatario}>
                      {f.clienteDestinatario} ({f.cidadeUfDestino})
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`font-semibold ${f.pesoCobradoKg !== f.pesoContratualKg ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                      {f.pesoCobradoKg} kg
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      (Aferido: {f.pesoContratualKg} kg)
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    R$ {f.valorFreteCobradoCte.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">
                    R$ {f.valorFreteContratualCalculado.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold">
                    {f.divergenciaValor > 0 ? (
                      <span className="text-rose-600">
                        +R$ {f.divergenciaValor.toFixed(2)} (+{f.divergenciaPercentual}%)
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">R$ 0,00</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {f.statusAuditoria === 'APROVADO' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Conforme
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Divergente
                      </span>
                    )}
                    {f.glosaAceita && (
                      <span className="block text-[9px] text-emerald-700 font-bold mt-0.5">
                        Glosa Emitida
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {f.divergenciaValor > 0 && !f.glosaAceita && (
                        <button
                          onClick={() => aplicarGlosa(f.id)}
                          title="Emitir Notificação de Glosa/Contestação"
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded shadow-2xs transition-colors"
                        >
                          Glosar (+Contestação)
                        </button>
                      )}
                      {f.statusAuditoria !== 'APROVADO' && (
                        <button
                          onClick={() => aprovarFatura(f.id)}
                          title="Aprovar Fatura Manualmente"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded transition-colors"
                        >
                          Aprovar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Adicionar Novo CT-e para Auditoria */}
      {modalNovoCte && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                Auditar & Conciliar Novo CT-e
              </h3>
              <button onClick={() => setModalNovoCte(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número do CT-e:</label>
                <input
                  type="text"
                  placeholder="Ex: CT-e 0098234"
                  value={novoCteNumero}
                  onChange={(e) => setNovoCteNumero(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transportadora Emitente:</label>
                <select
                  value={novoCteTranspId}
                  onChange={(e) => setNovoCteTranspId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {transportadoras.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nomeFantasia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número NF-e Vinculada:</label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 004929"
                  value={novoCteNf}
                  onChange={(e) => setNovoCteNf(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Destinatário & Cidade:</label>
                <input
                  type="text"
                  value={novoCteCliente}
                  onChange={(e) => setNovoCteCliente(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Peso Cobrado no CT-e (kg):</label>
                <input
                  type="number"
                  value={novoCtePesoCobrado}
                  onChange={(e) => setNovoCtePesoCobrado(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Peso Aferido na Fábrica (kg):</label>
                <input
                  type="number"
                  value={novoCtePesoContratual}
                  onChange={(e) => setNovoCtePesoContratual(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Valor Cobrado no CT-e (R$):</label>
                <input
                  type="number"
                  value={novoCteValorCobrado}
                  onChange={(e) => setNovoCteValorCobrado(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Valor Contratual Calculado (R$):</label>
                <input
                  type="number"
                  value={novoCteValorContratual}
                  onChange={(e) => setNovoCteValorContratual(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-indigo-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModalNovoCte(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
                Cancelar
              </button>
              <button
                onClick={() => {
                  const transpSel = transportadoras.find((t) => t.id === novoCteTranspId);
                  const divergencia = Math.max(0, novoCteValorCobrado - novoCteValorContratual);
                  const perc = novoCteValorContratual > 0 ? (divergencia / novoCteValorContratual) * 100 : 0;

                  const novaFatura: ItemAuditoriaFatura = {
                    id: `FAT-00${faturas.length + 1}`,
                    numeroConhecimentoCte: novoCteNumero || `CT-e 00${Math.floor(10000 + Math.random() * 90000)}`,
                    chaveAcessoCte: '352608' + Math.floor(1000000000000000 + Math.random() * 9000000000000000),
                    transportadoraId: novoCteTranspId,
                    transportadoraNome: transpSel?.nomeFantasia || 'Transportadora Auditada',
                    cnpjTransportadora: transpSel?.cnpj || '00.000.000/0001-00',
                    dataEmissaoCte: new Date().toISOString().split('T')[0],
                    numeroNotaFiscal: novoCteNf || 'NF-e 005001',
                    clienteDestinatario: novoCteCliente,
                    cidadeUfDestino: novoCteDestino,
                    pesoCobradoKg: novoCtePesoCobrado,
                    pesoContratualKg: novoCtePesoContratual,
                    valorFreteCobradoCte: novoCteValorCobrado,
                    valorFreteContratualCalculado: novoCteValorContratual,
                    divergenciaValor: parseFloat(divergencia.toFixed(2)),
                    divergenciaPercentual: parseFloat(perc.toFixed(1)),
                    statusAuditoria: divergencia > 0 ? 'DIVERGENCIA_COBRANCA_INDEVIDA' : 'APROVADO',
                  };

                  setFaturas((prev) => [novaFatura, ...prev]);
                  setModalNovoCte(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
              >
                Concluir Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
