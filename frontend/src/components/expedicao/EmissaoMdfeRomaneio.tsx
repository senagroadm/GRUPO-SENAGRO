'use client';

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Send,
  RefreshCw,
  FileCheck2,
  Layers,
  MapPin,
  Barcode,
  Calendar,
  Lock,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { CargaExpedicao, Transportadora, VeiculoFrota, Motorista } from '@/backend/modules/expedicao/expedicao-types';
import { Empresa } from '@/backend/core/types/company';

interface EmissaoMdfeRomaneioProps {
  empresaAtiva: Empresa;
  cargas: CargaExpedicao[];
  transportadoras: Transportadora[];
  veiculos: VeiculoFrota[];
  motoristas: Motorista[];
}

export function EmissaoMdfeRomaneio({
  empresaAtiva,
  cargas,
  transportadoras,
  veiculos,
  motoristas,
}: EmissaoMdfeRomaneioProps) {
  const [manifestos, setManifestos] = useState<any[]>([
    {
      id: 'MDF-2026-0089',
      numeroMdfe: '000.001.458',
      serie: '1',
      chaveAcesso: '35260912345678000195580010000014581001234567',
      status: 'AUTORIZADO',
      ufOrigem: empresaAtiva.estado || 'SP',
      ufDestino: 'PR',
      placaVeiculo: 'BRA2E19',
      tipoVeiculo: 'Carreta Baú',
      motoristaNome: 'Carlos Eduardo Menezes',
      motoristaCpf: '123.456.789-00',
      rntrc: '12883904',
      apoliceSeguro: 'APOL-PORTO-2026-9812',
      seguradora: 'Porto Seguro Cargas',
      averbacaoProtocolo: 'AVB-8839102-2026',
      quantidadeNfes: 6,
      valorTotalCarga: 248900.0,
      pesoBrutoTotalKg: 14200,
      dataEmissao: '2026-09-01 08:30',
      protocoloAutorizacao: '135260098123456',
    },
    {
      id: 'MDF-2026-0090',
      numeroMdfe: '000.001.459',
      serie: '1',
      chaveAcesso: '35260912345678000195580010000014591001234568',
      status: 'EM_PROCESSAMENTO',
      ufOrigem: empresaAtiva.estado || 'SP',
      ufDestino: 'SC',
      placaVeiculo: 'SCX4H88',
      tipoVeiculo: 'Bitrem Graneleiro',
      motoristaNome: 'Roberto Alencar',
      motoristaCpf: '987.654.321-11',
      rntrc: '99281723',
      apoliceSeguro: 'APOL-MAPFRE-4491',
      seguradora: 'Mapfre Seguros',
      averbacaoProtocolo: 'AVB-1992831-2026',
      quantidadeNfes: 4,
      valorTotalCarga: 189500.0,
      pesoBrutoTotalKg: 28500,
      dataEmissao: '2026-09-01 09:15',
      protocoloAutorizacao: '135260098123499',
    },
  ]);

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [cargaSelecionadaId, setCargaSelecionadaId] = useState(cargas[0]?.id || '');
  const [ufDestino, setUfDestino] = useState('PR');
  const [placaSelecionada, setPlacaSelecionada] = useState(veiculos[0]?.placa || 'BRA2E19');
  const [motoristaSelecionado, setMotoristaSelecionado] = useState(motoristas[0]?.nome || 'Carlos Eduardo Menezes');
  const [seguradoraNome, setSeguradoraNome] = useState('Porto Seguro Transportes');
  const [numeroApolice, setNumeroApolice] = useState('APOL-8849-BR');
  const [rntrcNumero, setRntrcNumero] = useState('12883904');
  const [manifestoParaImprimir, setManifestoParaImprimir] = useState<any | null>(null);

  const emitirNovoMdfe = () => {
    const novo = {
      id: `MDF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      numeroMdfe: `000.001.${Math.floor(460 + Math.random() * 50)}`,
      serie: '1',
      chaveAcesso: `352609123456780001955800100000${Math.floor(1000 + Math.random() * 9000)}1001234569`,
      status: 'AUTORIZADO',
      ufOrigem: empresaAtiva.estado || 'SP',
      ufDestino,
      placaVeiculo: placaSelecionada,
      tipoVeiculo: 'Truck 3 Eixos',
      motoristaNome: motoristaSelecionado,
      motoristaCpf: '123.456.789-00',
      rntrc: rntrcNumero,
      apoliceSeguro: numeroApolice,
      seguradora: seguradoraNome,
      averbacaoProtocolo: `AVB-${Math.floor(1000000 + Math.random() * 9000000)}-2026`,
      quantidadeNfes: 5,
      valorTotalCarga: 198400.0,
      pesoBrutoTotalKg: 12400,
      dataEmissao: '2026-09-01 10:45',
      protocoloAutorizacao: `1352600${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setManifestos([novo, ...manifestos]);
    setModalNovoAberto(false);
    setManifestoParaImprimir(novo);
  };

  const encerrarMdfe = (id: string) => {
    setManifestos(
      manifestos.map((m) =>
        m.id === id ? { ...m, status: 'ENCERRADO', dataEncerramento: '2026-09-01 11:00' } : m
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Emissão de MDF-e, Romaneio & Averbação de Carga
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full">
                SEFAZ 3.0 Integrada
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Geração de Manifesto Eletrônico de Documentos Fiscais, protocolo automático de averbação RCTR-C e encerramento de percurso.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNovoAberto(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white rounded-lg transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Emitir Novo MDF-e / Romaneio
        </button>
      </div>

      {/* Grid de Resumo de Emissões */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">MDF-e Autorizados Hoje</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {manifestos.filter((m) => m.status === 'AUTORIZADO').length}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">100% Averbação Confirmada</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Valor Total Sob Manifesto</span>
          <div className="text-xl font-black text-blue-700 mt-1">
            R$ {manifestos.reduce((acc, m) => acc + m.valorTotalCarga, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Apólices ativas RCTR-C / RCF-DC</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Peso Total em Trânsito</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {(manifestos.reduce((acc, m) => acc + m.pesoBrutoTotalKg, 0) / 1000).toFixed(1)} ton
          </div>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Em viagens interestaduais</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">SLA SEFAZ Transmissão</span>
          <div className="text-xl font-black text-emerald-600 mt-1">1.2 seg</div>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Sem rejeições fiscais</span>
        </div>
      </div>

      {/* Tabela de Manifestos Ativos */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Manifestos Eletrônicos (MDF-e) & Romaneios Gerados
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">MDF-e / Chave</th>
                <th className="p-3">Rota (Origem / Destino)</th>
                <th className="p-3">Veículo / Motorista</th>
                <th className="p-3">Averbação Seguro</th>
                <th className="p-3">Carga / NF-es</th>
                <th className="p-3">Status SEFAZ</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {manifestos.map((man) => (
                <tr key={man.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">MDF-e nº {man.numeroMdfe}</div>
                    <div className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]" title={man.chaveAcesso}>
                      {man.chaveAcesso}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <span>{man.ufOrigem}</span>
                      <span className="text-slate-400">➔</span>
                      <span className="text-blue-700">{man.ufDestino}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{man.dataEmissao}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      {man.placaVeiculo}
                    </div>
                    <div className="text-[10px] text-slate-500">{man.motoristaNome}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {man.seguradora}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Prot: {man.averbacaoProtocolo}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      R$ {man.valorTotalCarga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {man.quantidadeNfes} NF-es • {(man.pesoBrutoTotalKg / 1000).toFixed(2)} ton
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                        man.status === 'AUTORIZADO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : man.status === 'ENCERRADO'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {man.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setManifestoParaImprimir(man)}
                        title="Imprimir DAMDFE e Romaneio"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {man.status === 'AUTORIZADO' && (
                        <button
                          onClick={() => encerrarMdfe(man.id)}
                          title="Encerrar MDF-e no destino (Liberação na SEFAZ)"
                          className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                        >
                          Encerrar
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

      {/* Modal de Emissão de MDF-e */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Emissão de Manifesto MDF-e & Averbação Automática
              </h3>
              <button onClick={() => setModalNovoAberto(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">UF Origem:</label>
                  <input
                    type="text"
                    disabled
                    value={empresaAtiva.estado || 'SP'}
                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded-lg font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">UF Destino do Percurso:</label>
                  <select
                    value={ufDestino}
                    onChange={(e) => setUfDestino(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="PR">Paraná (PR)</option>
                    <option value="SC">Santa Catarina (SC)</option>
                    <option value="RS">Rio Grande do Sul (RS)</option>
                    <option value="MG">Minas Gerais (MG)</option>
                    <option value="RJ">Rio de Janeiro (RJ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Veículo / Placa:</label>
                  <select
                    value={placaSelecionada}
                    onChange={(e) => setPlacaSelecionada(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {veiculos.map((v) => (
                      <option key={v.id} value={v.placa}>
                        {v.placa} ({v.modelo})
                      </option>
                    ))}
                    <option value="BRA2E19">BRA2E19 (Carreta Scania)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Motorista / CPF:</label>
                  <select
                    value={motoristaSelecionado}
                    onChange={(e) => setMotoristaSelecionado(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {motoristas.map((m) => (
                      <option key={m.id} value={m.nome}>
                        {m.nome}
                      </option>
                    ))}
                    <option value="Carlos Eduardo Menezes">Carlos Eduardo Menezes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">RNTRC da Transportadora:</label>
                  <input
                    type="text"
                    value={rntrcNumero}
                    onChange={(e) => setRntrcNumero(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apólice de Seguro (RCTR-C):</label>
                  <input
                    type="text"
                    value={numeroApolice}
                    onChange={(e) => setNumeroApolice(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Averbação Automática Prévia
                </div>
                <p className="text-[11px] text-blue-700">
                  O sistema averbará as NF-es vinculadas junto à seguradora e validará as chaves de acesso com a SEFAZ antes de retornar o protocolo de autorização.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalNovoAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={emitirNovoMdfe}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Transmitir para SEFAZ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Visualização de Impressão do DAMDFE & Romaneio */}
      {manifestoParaImprimir && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                DAMDFE & Romaneio de Carga Unificado
              </h3>
              <button onClick={() => setManifestoParaImprimir(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl space-y-4 font-mono text-xs text-slate-800">
              <div className="text-center border-b border-slate-300 pb-3">
                <div className="font-bold text-sm text-slate-900">DOCUMENTO AUXILIAR DE MANIFESTO ELETRÔNICO (DAMDFE)</div>
                <div className="text-[10px] text-slate-500">MDF-e Nº {manifestoParaImprimir.numeroMdfe} • Série {manifestoParaImprimir.serie}</div>
                <div className="text-[9px] text-slate-400 mt-1">CHAVE DE ACESSO: {manifestoParaImprimir.chaveAcesso}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><strong>EMITENTE:</strong> {empresaAtiva.razaoSocial}</div>
                <div><strong>CNPJ:</strong> {empresaAtiva.cnpj}</div>
                <div><strong>UF CARREGAMENTO:</strong> {manifestoParaImprimir.ufOrigem}</div>
                <div><strong>UF DESCARREGAMENTO:</strong> {manifestoParaImprimir.ufDestino}</div>
                <div><strong>VEÍCULO / PLACA:</strong> {manifestoParaImprimir.placaVeiculo}</div>
                <div><strong>CONDUTOR:</strong> {manifestoParaImprimir.motoristaNome}</div>
                <div><strong>VALOR CARGA:</strong> R$ {manifestoParaImprimir.valorTotalCarga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div><strong>PESO BRUTO:</strong> {manifestoParaImprimir.pesoBrutoTotalKg} kg</div>
                <div><strong>SEGURADORA:</strong> {manifestoParaImprimir.seguradora}</div>
                <div><strong>AVERBAÇÃO:</strong> {manifestoParaImprimir.averbacaoProtocolo}</div>
              </div>

              <div className="border-t border-slate-300 pt-3 text-center">
                <div className="font-bold text-[11px] mb-1">PROTOCOLO DE AUTORIZAÇÃO SEFAZ:</div>
                <div className="text-xs font-black text-emerald-700">{manifestoParaImprimir.protocoloAutorizacao} • {manifestoParaImprimir.dataEmissao}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setManifestoParaImprimir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir Documento Fiscal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
