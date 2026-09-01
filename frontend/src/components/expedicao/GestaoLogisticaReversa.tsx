'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Package,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Factory,
  Building2,
  Plus,
  Clock,
  HelpCircle,
  Truck,
} from 'lucide-react';
import { Empresa } from '@/backend/core/types/company';

export interface SolicitacaoLogisticaReversa {
  id: string;
  numeroRMA: string;
  dataAbertura: string;
  clienteNome: string;
  cnpjCliente: string;
  cidadeUfOrigem: string;
  numeroNotaFiscalOrigem: string;
  numeroNotaFiscalDevolucao?: string;
  motivoDevolucao: 'DEFEITO_FABRICACAO' | 'AVARIA_TRANSPORTE' | 'DIVERGENCIA_PEDIDO' | 'DESISTENCIA_COMERCIAL';
  descricaoMotivo: string;
  codigoAutorizacaoPostagemOuColeta: string;
  transportadoraColetaNome: string;
  statusFluxo:
    | 'SOLICITADA'
    | 'COLETA_AUTORIZADA'
    | 'EM_TRANSITO_RETORNO'
    | 'RECEBIDO_DOCA_FABRICA'
    | 'LAUDO_QUALIDADE_CONCLUIDO'
    | 'ESTOQUE_OU_SUCATA_DEFINIDO';
  tipoDestinacaoFinal?: 'RETRABALHO' | 'RETORNO_ESTOQUE_A' | 'ESTOQUE_SALVADOS_B' | 'SUCATA_DESCARTE';
  valorTotalDevolucao: number;
  gerouEstornoOuCredito: boolean;
  laudoTecnicoObs?: string;
}

interface GestaoLogisticaReversaProps {
  empresaAtiva: Empresa;
}

const REVERSA_MOCK_INICIAL: SolicitacaoLogisticaReversa[] = [
  {
    id: 'RMA-2026-001',
    numeroRMA: 'RMA-0891',
    dataAbertura: '2026-08-25',
    clienteNome: 'Metalúrgica Triângulo Mineiro',
    cnpjCliente: '32.109.876/0001-44',
    cidadeUfOrigem: 'Uberlândia/MG',
    numeroNotaFiscalOrigem: 'NF-e 004810',
    numeroNotaFiscalDevolucao: 'NF-e 000112 (Devolução)',
    motivoDevolucao: 'AVARIA_TRANSPORTE',
    descricaoMotivo: 'Pintura eletrostática riscada e amassamento no painel lateral ocorrido durante transbordo.',
    codigoAutorizacaoPostagemOuColeta: 'COL-MG-88912',
    transportadoraColetaNome: 'Jamef Encomendas Urgentes',
    statusFluxo: 'RECEBIDO_DOCA_FABRICA',
    tipoDestinacaoFinal: 'RETRABALHO',
    valorTotalDevolucao: 3250.0,
    gerouEstornoOuCredito: true,
    laudoTecnicoObs: 'Peça conferida na doca. Necessita repintura e polimento para reinserção em estoque.',
  },
  {
    id: 'RMA-2026-002',
    numeroRMA: 'RMA-0892',
    dataAbertura: '2026-08-29',
    clienteNome: 'Construtora Horizonte Verde',
    cnpjCliente: '19.456.789/0001-22',
    cidadeUfOrigem: 'São José do Rio Preto/SP',
    numeroNotaFiscalOrigem: 'NF-e 004889',
    motivoDevolucao: 'DIVERGENCIA_PEDIDO',
    descricaoMotivo: 'Bitola e furação enviadas diferentes da especificação técnica aprovada no pedido.',
    codigoAutorizacaoPostagemOuColeta: 'COL-SP-44120',
    transportadoraColetaNome: 'Rodonaves Transportes Ltda',
    statusFluxo: 'EM_TRANSITO_RETORNO',
    valorTotalDevolucao: 5400.0,
    gerouEstornoOuCredito: false,
  },
  {
    id: 'RMA-2026-003',
    numeroRMA: 'RMA-0893',
    dataAbertura: '2026-08-30',
    clienteNome: 'Agropecuária Vale do Paranapanema',
    cnpjCliente: '54.321.987/0001-88',
    cidadeUfOrigem: 'Assis/SP',
    numeroNotaFiscalOrigem: 'NF-e 004921',
    motivoDevolucao: 'DEFEITO_FABRICACAO',
    descricaoMotivo: 'Falha no sensor eletrônico de pressão após 24 horas de teste em bancada.',
    codigoAutorizacaoPostagemOuColeta: 'COL-SP-99104',
    transportadoraColetaNome: 'Braspress Transportes Urgentes',
    statusFluxo: 'COLETA_AUTORIZADA',
    valorTotalDevolucao: 1890.0,
    gerouEstornoOuCredito: false,
  },
];

export function GestaoLogisticaReversa({ empresaAtiva }: GestaoLogisticaReversaProps) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoLogisticaReversa[]>(REVERSA_MOCK_INICIAL);
  const [modalNovoRma, setModalNovoRma] = useState(false);

  // Form de Novo RMA
  const [clienteNome, setClienteNome] = useState('');
  const [nfOrigem, setNfOrigem] = useState('');
  const [motivo, setMotivo] = useState<'DEFEITO_FABRICACAO' | 'AVARIA_TRANSPORTE' | 'DIVERGENCIA_PEDIDO' | 'DESISTENCIA_COMERCIAL'>('AVARIA_TRANSPORTE');
  const [descMotivo, setDescMotivo] = useState('');
  const [valorDev, setValorDev] = useState(2500);
  const [cidadeOrigem, setCidadeOrigem] = useState('Ribeirão Preto/SP');
  const [transpColeta, setTranspColeta] = useState('Rodonaves Transportes Ltda');

  const avancarStatusRMA = (id: string, novoStatus: SolicitacaoLogisticaReversa['statusFluxo'], destinacao?: SolicitacaoLogisticaReversa['tipoDestinacaoFinal']) => {
    setSolicitacoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, statusFluxo: novoStatus, tipoDestinacaoFinal: destinacao || s.tipoDestinacaoFinal } : s))
    );
  };

  const getStatusRmaBadge = (status: SolicitacaoLogisticaReversa['statusFluxo']) => {
    switch (status) {
      case 'SOLICITADA':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full text-[10px]">Solicitada</span>;
      case 'COLETA_AUTORIZADA':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full text-[10px]">Coleta Emitida</span>;
      case 'EM_TRANSITO_RETORNO':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">Em Retorno</span>;
      case 'RECEBIDO_DOCA_FABRICA':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-full text-[10px]">Recebido na Doca</span>;
      case 'LAUDO_QUALIDADE_CONCLUIDO':
      case 'ESTOQUE_OU_SUCATA_DEFINIDO':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">Concluído</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Gestão de Devoluções & Logística Reversa (RMA)
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-full">
                Controle de Doca e Laudo
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Rastreamento ponta a ponta de coletas reversas, conferência física na fábrica, laudo técnico de garantia e reinserção em estoque ou refugo.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNovoRma(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Abrir Solicitação RMA
        </button>
      </div>

      {/* KPI Cards de Reversa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">RMAs Ativos em Trânsito</span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {solicitacoes.filter((s) => s.statusFluxo !== 'ESTOQUE_OU_SUCATA_DEFINIDO').length}
          </div>
          <span className="text-xs text-slate-500">processos em andamento</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">Valor em Devoluções</span>
          <div className="mt-2 text-2xl font-black text-purple-700">
            R$ {solicitacoes.reduce((acc, s) => acc + s.valorTotalDevolucao, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500">mercadorias retornando</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">Taxa de Retrabalho/Reaproveitamento</span>
          <div className="mt-2 text-2xl font-black text-emerald-600">85.0%</div>
          <span className="text-xs text-slate-500">recuperação após laudo da qualidade</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">Tempo Médio de Ciclo Reverso</span>
          <div className="mt-2 text-2xl font-black text-indigo-700">5.2 dias</div>
          <span className="text-xs text-slate-500">da coleta até entrada fiscal</span>
        </div>
      </div>

      {/* Pipeline de RMAs e Acompanhamento */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Fila de Processamento de Logística Reversa ({solicitacoes.length} solicitações)
          </h3>
          <span className="text-xs text-slate-400">Integração com Doca de Recebimento & Fiscal</span>
        </div>

        <div className="divide-y divide-slate-100">
          {solicitacoes.map((rma) => (
            <div key={rma.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-slate-900 text-sm">{rma.numeroRMA}</span>
                  {getStatusRmaBadge(rma.statusFluxo)}
                  <span className="text-xs font-bold text-slate-700">{rma.clienteNome}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  R$ {rma.valorTotalDevolucao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                <div>
                  <strong>Motivo:</strong> {rma.motivoDevolucao.replace('_', ' ')}
                  <p className="text-[11px] text-slate-500 mt-0.5">{rma.descricaoMotivo}</p>
                </div>
                <div>
                  <strong>NF Origem:</strong> {rma.numeroNotaFiscalOrigem}
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Origem: {rma.cidadeUfOrigem} • Coleta: {rma.codigoAutorizacaoPostagemOuColeta}
                  </div>
                </div>
                <div>
                  <strong>Transportador Coleta:</strong> {rma.transportadoraColetaNome}
                  {rma.laudoTecnicoObs && (
                    <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                      <strong>Laudo:</strong> {rma.laudoTecnicoObs}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação do Fluxo */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {rma.statusFluxo === 'COLETA_AUTORIZADA' && (
                  <button
                    onClick={() => avancarStatusRMA(rma.id, 'EM_TRANSITO_RETORNO')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Confirmar Coleta no Cliente
                  </button>
                )}

                {rma.statusFluxo === 'EM_TRANSITO_RETORNO' && (
                  <button
                    onClick={() => avancarStatusRMA(rma.id, 'RECEBIDO_DOCA_FABRICA')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Receber na Doca & Bipar Volumes
                  </button>
                )}

                {rma.statusFluxo === 'RECEBIDO_DOCA_FABRICA' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => avancarStatusRMA(rma.id, 'ESTOQUE_OU_SUCATA_DEFINIDO', 'RETRABALHO')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      Aprovar Laudo: Enviar p/ Retrabalho
                    </button>
                    <button
                      onClick={() => avancarStatusRMA(rma.id, 'ESTOQUE_OU_SUCATA_DEFINIDO', 'RETORNO_ESTOQUE_A')}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      Reintegrar ao Estoque Novo
                    </button>
                  </div>
                )}

                {rma.statusFluxo === 'ESTOQUE_OU_SUCATA_DEFINIDO' && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Destinação Concluída ({rma.tipoDestinacaoFinal})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Novo RMA */}
      {modalNovoRma && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                Abertura de Solicitação de Logística Reversa (RMA)
              </h3>
              <button onClick={() => setModalNovoRma(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cliente Solicitante:</label>
                <input
                  type="text"
                  placeholder="Ex: Usina Açucareira Central"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">NF-e de Origem:</label>
                  <input
                    type="text"
                    placeholder="Ex: NF-e 004950"
                    value={nfOrigem}
                    onChange={(e) => setNfOrigem(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valor da Devolução (R$):</label>
                  <input
                    type="number"
                    value={valorDev}
                    onChange={(e) => setValorDev(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Motivo da Reversa:</label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="AVARIA_TRANSPORTE">Avaria em Transporte</option>
                    <option value="DEFEITO_FABRICACAO">Defeito de Fabricação / Garantia</option>
                    <option value="DIVERGENCIA_PEDIDO">Divergência de Pedido / Item Errado</option>
                    <option value="DESISTENCIA_COMERCIAL">Desistência Comercial / Devolução</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Transportadora Coleta:</label>
                  <input
                    type="text"
                    value={transpColeta}
                    onChange={(e) => setTranspColeta(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detalhamento do Ocorrido:</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o motivo da devolução e fotos/evidências anexadas..."
                  value={descMotivo}
                  onChange={(e) => setDescMotivo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModalNovoRma(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
                Cancelar
              </button>
              <button
                onClick={() => {
                  const novo: SolicitacaoLogisticaReversa = {
                    id: `RMA-2026-00${solicitacoes.length + 1}`,
                    numeroRMA: `RMA-0${Math.floor(1000 + Math.random() * 9000)}`,
                    dataAbertura: new Date().toISOString().split('T')[0],
                    clienteNome: clienteNome || 'Cliente Homologado',
                    cnpjCliente: '00.000.000/0001-00',
                    cidadeUfOrigem: cidadeOrigem,
                    numeroNotaFiscalOrigem: nfOrigem || 'NF-e 005000',
                    motivoDevolucao: motivo,
                    descricaoMotivo: descMotivo || 'Solicitação gerada via portal de expedição.',
                    codigoAutorizacaoPostagemOuColeta: `COL-REV-${Math.floor(10000 + Math.random() * 90000)}`,
                    transportadoraColetaNome: transpColeta,
                    statusFluxo: 'COLETA_AUTORIZADA',
                    valorTotalDevolucao: valorDev,
                    gerouEstornoOuCredito: false,
                  };
                  setSolicitacoes((prev) => [novo, ...prev]);
                  setModalNovoRma(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
              >
                Gerar Autorização de Coleta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
