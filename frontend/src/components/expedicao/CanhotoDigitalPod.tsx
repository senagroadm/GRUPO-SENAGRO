'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  UserCheck,
  Search,
  Filter,
  Download,
  Image as ImageIcon,
  DollarSign,
  Smartphone,
  Eye,
  Check,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Expedicao } from '@/backend/modules/expedicao/expedicao-types';
import { Empresa } from '@/backend/core/types/company';

interface CanhotoDigitalPodProps {
  empresaAtiva: Empresa;
  expedicoes: Expedicao[];
  onConfirmarEntregaPod?: (expedicaoId: string, podData: any) => void;
}

export function CanhotoDigitalPod({
  empresaAtiva,
  expedicoes,
  onConfirmarEntregaPod,
}: CanhotoDigitalPodProps) {
  const [canhotos, setCanhotos] = useState<any[]>([
    {
      id: 'POD-2026-8801',
      expedicaoId: expedicoes[0]?.id || 'EXP-001',
      numeroExpedicao: expedicoes[0]?.numeroExpedicao || 'EXP-2026-0001',
      numeroNfe: '000.124.901',
      clienteNome: expedicoes[0]?.clienteNome || 'Metalúrgica Brasil S/A',
      cidadeUf: 'Curitiba/PR',
      transportadora: 'Alfa Transportes Rápidos',
      motoristaNome: 'Carlos Eduardo Menezes',
      dataEntrega: '2026-09-01 10:24',
      statusPod: 'VALIDADO_FINANCEIRO',
      recebedorNome: 'Marcos Vinícius de Paula',
      recebedorDocumento: '38.991.204-5',
      geolocalizacao: '-25.4284, -49.2733 (Curitiba - Doca 02)',
      fotoCanhotoUrl: 'https://picsum.photos/seed/canhoto1/400/250',
      assinaturaDigitalUrl: 'https://picsum.photos/seed/signature1/300/100',
      valorFaturaNfe: 84500.0,
      liquidacaoFinanceira: 'LIBERADA_ANTECIPADA',
      ressalvaTexto: '',
    },
    {
      id: 'POD-2026-8802',
      expedicaoId: expedicoes[1]?.id || 'EXP-002',
      numeroExpedicao: expedicoes[1]?.numeroExpedicao || 'EXP-2026-0002',
      numeroNfe: '000.124.902',
      clienteNome: 'Indústria Mecânica Paulistana',
      cidadeUf: 'Campinas/SP',
      transportadora: 'TransVale Cargas Pesadas',
      motoristaNome: 'Roberto Alencar',
      dataEntrega: '2026-09-01 09:12',
      statusPod: 'AGUARDANDO_AUDITORIA',
      recebedorNome: 'Renata Silveira',
      recebedorDocumento: '44.102.889-1',
      geolocalizacao: '-22.9099, -47.0626 (Campinas - Portaria A)',
      fotoCanhotoUrl: 'https://picsum.photos/seed/canhoto2/400/250',
      assinaturaDigitalUrl: 'https://picsum.photos/seed/signature2/300/100',
      valorFaturaNfe: 142000.0,
      liquidacaoFinanceira: 'EM_CONCILIACAO',
      ressalvaTexto: 'Volume 03 recebido com fita adesiva de reforço, mercadoria intacta.',
    },
  ]);

  const [modalRegistroAberto, setModalRegistroAberto] = useState(false);
  const [canhotoSelecionadoDetalhe, setCanhotoSelecionadoDetalhe] = useState<any | null>(null);
  const [filtroTexto, setFiltroTexto] = useState('');

  // Form State para Novo Canhoto Mobile
  const [expedicaoIdForm, setExpedicaoIdForm] = useState(expedicoes[0]?.id || '');
  const [recebedorNome, setRecebedorNome] = useState('');
  const [recebedorRg, setRecebedorRg] = useState('');
  const [ressalva, setRessalva] = useState('');

  const salvarNovoPod = () => {
    const exp = expedicoes.find((e) => e.id === expedicaoIdForm) || expedicoes[0];
    const novo = {
      id: `POD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      expedicaoId: exp.id,
      numeroExpedicao: exp.numeroExpedicao,
      numeroNfe: exp.chaveAcessoNfe ? exp.chaveAcessoNfe.slice(-9) : '000.124.903',
      clienteNome: exp.clienteNome,
      cidadeUf: `${exp.cidadeDestino}/${exp.ufDestino}`,
      transportadora: exp.transportadoraNome || 'Transportadora Contratada',
      motoristaNome: exp.motoristaNome || 'Motorista de Rota',
      dataEntrega: new Date().toISOString().replace('T', ' ').slice(0, 16),
      statusPod: 'VALIDADO_FINANCEIRO',
      recebedorNome: recebedorNome || 'Encarregado de Recebimento',
      recebedorDocumento: recebedorRg || '29.384.112-X',
      geolocalizacao: `-23.5505, -46.6333 (${exp.cidadeDestino} - Galpão Central)`,
      fotoCanhotoUrl: 'https://picsum.photos/seed/canhoto3/400/250',
      assinaturaDigitalUrl: 'https://picsum.photos/seed/signature3/300/100',
      valorFaturaNfe: exp.valorTotalMercadorias || 50000,
      liquidacaoFinanceira: 'LIBERADA_ANTECIPADA',
      ressalvaTexto: ressalva,
    };

    setCanhotos([novo, ...canhotos]);
    setModalRegistroAberto(false);
    if (onConfirmarEntregaPod) {
      onConfirmarEntregaPod(exp.id, novo);
    }
  };

  const canhotosFiltrados = canhotos.filter(
    (c) =>
      c.numeroExpedicao.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      c.clienteNome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      c.recebedorNome.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Portal do Canhoto Digital & Comprovação de Entrega (POD)
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                Liquidação Imediata
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Captura instantânea de comprovante de entrega (POD), assinatura eletrônica, coordenadas GPS e liberação antecipada de faturamento.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalRegistroAberto(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-lg transition-colors flex items-center gap-2 shadow-xs"
        >
          <Smartphone className="w-4 h-4" />
          Registrar Canhoto / Baixa Mobile
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Tempo Médio de Baixa</span>
          <div className="text-xl font-black text-emerald-600 mt-1">14 minutos</div>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Contra 12 dias no canhoto físico</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Faturamento Liberado</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            R$ {canhotos.reduce((acc, c) => acc + c.valorFaturaNfe, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">100% canhotos conciliados</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Taxa de Eficácia POD</span>
          <div className="text-xl font-black text-indigo-600 mt-1">99.4%</div>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Com foto, GPS e assinatura</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Entregas com Ressalva</span>
          <div className="text-xl font-black text-amber-600 mt-1">1 registro</div>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Tratada em tempo real</span>
        </div>
      </div>

      {/* Tabela de Canhotos */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Buscar por cliente, pedido ou recebedor..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Pedido / NF-e</th>
                <th className="p-3">Cliente / Destino</th>
                <th className="p-3">Recebedor / Documento</th>
                <th className="p-3">Geolocalização / Hora</th>
                <th className="p-3">Valor Faturado</th>
                <th className="p-3">Status POD</th>
                <th className="p-3 text-right">Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {canhotosFiltrados.map((canhoto) => (
                <tr key={canhoto.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{canhoto.numeroExpedicao}</div>
                    <div className="text-[10px] text-slate-500">NF-e: {canhoto.numeroNfe}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{canhoto.clienteNome}</div>
                    <div className="text-[10px] text-slate-500">{canhoto.cidadeUf} • {canhoto.transportadora}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {canhoto.recebedorNome}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Doc: {canhoto.recebedorDocumento}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {canhoto.dataEntrega}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate max-w-[200px]" title={canhoto.geolocalizacao}>
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      {canhoto.geolocalizacao}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      R$ {canhoto.valorFaturaNfe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      {canhoto.liquidacaoFinanceira === 'LIBERADA_ANTECIPADA' ? 'Faturamento Liberado' : 'Em Análise'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                        canhoto.statusPod === 'VALIDADO_FINANCEIRO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {canhoto.statusPod === 'VALIDADO_FINANCEIRO' ? 'Comprovado' : 'Pendente Auditoria'}
                    </span>
                    {canhoto.ressalvaTexto && (
                      <span className="block text-[9px] text-amber-700 font-bold mt-0.5">Com Ressalva</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setCanhotoSelecionadoDetalhe(canhoto)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Ver POD
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Canhoto Mobile */}
      {modalRegistroAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                Registrar Comprovante de Entrega Digital (POD)
              </h3>
              <button onClick={() => setModalRegistroAberto(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expedição / Remessa:</label>
                <select
                  value={expedicaoIdForm}
                  onChange={(e) => setExpedicaoIdForm(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                >
                  {expedicoes.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.numeroExpedicao} - {exp.clienteNome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nome do Recebedor:</label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={recebedorNome}
                    onChange={(e) => setRecebedorNome(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">RG / CPF Recebedor:</label>
                  <input
                    type="text"
                    placeholder="Ex: 34.567.890-1"
                    value={recebedorRg}
                    onChange={(e) => setRecebedorRg(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ressalvas ou Observações de Entrega:</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Entregue na doca B, embalagens conferidas sem avaria."
                  value={ressalva}
                  onChange={(e) => setRessalva(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Simulação de Foto & Assinatura */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Foto do Canhoto & Assinatura na Tela
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700">GPS Capturado</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  O aplicativo móvel vincula automaticamente o carimbo de data/hora oficial e as coordenadas de satélite do local da entrega.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalRegistroAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={salvarNovoPod}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirmar Entrega & Baixar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Canhoto Digital / POD */}
      {canhotoSelecionadoDetalhe && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                Comprovante de Entrega Digital - {canhotoSelecionadoDetalhe.numeroExpedicao}
              </h3>
              <button onClick={() => setCanhotoSelecionadoDetalhe(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-500 block">Cliente Destinatário:</span>
                  <strong className="text-slate-900">{canhotoSelecionadoDetalhe.clienteNome}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">NF-e Vinculada:</span>
                  <strong className="text-slate-900">{canhotoSelecionadoDetalhe.numeroNfe}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Recebedor:</span>
                  <strong className="text-slate-900">{canhotoSelecionadoDetalhe.recebedorNome} (Doc: {canhotoSelecionadoDetalhe.recebedorDocumento})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Data & Hora:</span>
                  <strong className="text-slate-900">{canhotoSelecionadoDetalhe.dataEntrega}</strong>
                </div>
              </div>

              {/* Imagens de Comprovação */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <span className="font-bold text-slate-700 block flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    Foto da Mercadoria / Canhoto:
                  </span>
                  <div className="h-32 bg-slate-100 rounded flex items-center justify-center text-slate-400 font-mono text-[10px] overflow-hidden">
                    <img
                      src={canhotoSelecionadoDetalhe.fotoCanhotoUrl}
                      alt="Canhoto"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <span className="font-bold text-slate-700 block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Assinatura Digital Capturada:
                  </span>
                  <div className="h-32 bg-slate-100 rounded flex items-center justify-center text-slate-400 font-mono text-[10px] overflow-hidden">
                    <img
                      src={canhotoSelecionadoDetalhe.assinaturaDigitalUrl}
                      alt="Assinatura"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {canhotoSelecionadoDetalhe.ressalvaTexto && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                  <strong className="block text-[11px] mb-0.5">Ressalva Registrada no Ato da Entrega:</strong>
                  <span>{canhotoSelecionadoDetalhe.ressalvaTexto}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCanhotoSelecionadoDetalhe(null)}
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
                <Download className="w-4 h-4" />
                Baixar Laudo POD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
