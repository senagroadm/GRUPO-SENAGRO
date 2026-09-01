'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Truck,
  Package,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Barcode,
  FileText,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Building2,
  User,
  Layers,
  Printer,
  Compass,
  Check,
  Scale,
  RefreshCw,
  Calculator,
  Receipt,
  RotateCcw,
  CalendarCheck,
  FileCheck,
  PackageCheck,
} from 'lucide-react';
import {
  Expedicao,
  CargaExpedicao,
  Transportadora,
  TabelaFrete,
  VeiculoFrota,
  Motorista,
  IndicadoresLogisticaOTIF,
  StatusExpedicao,
  ModalidadeFrete,
  TipoTransporte,
  TipoEmbalagem,
  TipoOcorrenciaTransporte,
} from '@/backend/modules/expedicao/expedicao-types';
import { Empresa } from '@/backend/core/types/company';
import { safeFetchJson } from '../api/safe-fetch';
import { BiLogisticaAvancado } from './expedicao/BiLogisticaAvancado';
import { RoteirizadorConsolidacao } from './expedicao/RoteirizadorConsolidacao';
import { CotacaoComparativaFrete } from './expedicao/CotacaoComparativaFrete';
import { AuditoriaFaturasFrete } from './expedicao/AuditoriaFaturasFrete';
import { GestaoLogisticaReversa } from './expedicao/GestaoLogisticaReversa';
import { AgendamentoDocaPatio } from './expedicao/AgendamentoDocaPatio';
import { ConferenciaCegaBipagem } from './expedicao/ConferenciaCegaBipagem';
import { EmissaoMdfeRomaneio } from './expedicao/EmissaoMdfeRomaneio';
import { CanhotoDigitalPod } from './expedicao/CanhotoDigitalPod';

interface ExpedicaoViewerProps {
  empresaAtiva: Empresa;
}

export function ExpedicaoViewer({ empresaAtiva }: ExpedicaoViewerProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'kpis'
    | 'conferencia'
    | 'roteirizador'
    | 'cargas'
    | 'mdfe'
    | 'fluxo'
    | 'tracking'
    | 'pod'
    | 'cotacoes'
    | 'auditoria'
    | 'reversa'
    | 'docas'
    | 'cadastros'
  >('kpis');
  const [expedicoes, setExpedicoes] = useState<Expedicao[]>([]);
  const [cargas, setCargas] = useState<CargaExpedicao[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [tabelasFrete, setTabelasFrete] = useState<TabelaFrete[]>([]);
  const [veiculos, setVeiculos] = useState<VeiculoFrota[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadoresLogisticaOTIF | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [selectedExpedicao, setSelectedExpedicao] = useState<Expedicao | null>(null);

  // Modals & Action States
  const [modalSeparacaoOpen, setModalSeparacaoOpen] = useState(false);
  const [modalConferenciaOpen, setModalConferenciaOpen] = useState(false);
  const [modalVolumesOpen, setModalVolumesOpen] = useState(false);
  const [modalDespachoOpen, setModalDespachoOpen] = useState(false);
  const [modalOcorrenciaOpen, setModalOcorrenciaOpen] = useState(false);
  const [modalEntregaOpen, setModalEntregaOpen] = useState(false);
  const [modalRomaneioOpen, setModalRomaneioOpen] = useState(false);
  const [modalNovaExpedicaoOpen, setModalNovaExpedicaoOpen] = useState(false);

  // Form states
  const [operadorNome, setOperadorNome] = useState('Danilo Siqueira');
  const [conferenteNome, setConferenteNome] = useState('Juliana Pires');
  const [pesoAferido, setPesoAferido] = useState<number>(0);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Volumes form
  const [tipoEmbalagem, setTipoEmbalagem] = useState<TipoEmbalagem>('PALLET_MADEIRA');
  const [compCm, setCompCm] = useState(120);
  const [largCm, setLargCm] = useState(100);
  const [altCm, setAltCm] = useState(120);
  const [pesoLiqVol, setPesoLiqVol] = useState(450);
  const [pesoBrutoVol, setPesoBrutoVol] = useState(480);
  const [lacreVol, setLacreVol] = useState('LAC-2026-99');

  // Ocorrencia form
  const [tipoOcorrencia, setTipoOcorrencia] = useState<TipoOcorrenciaTransporte>('AVARIA_PARCIAL');
  const [gravidadeOco, setGravidadeOco] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'>('MEDIA');
  const [descOco, setDescOco] = useState('');
  const [acaoOco, setAcaoOco] = useState('');
  const [geraRevOco, setGeraRevOco] = useState(true);

  // Entrega form
  const [recebedorNome, setRecebedorNome] = useState('');
  const [recebedorDoc, setRecebedorDoc] = useState('');
  const [cargoRecebedor, setCargoRecebedor] = useState('Conferente / Almoxarifado');
  const [ressalvasEntrega, setRessalvasEntrega] = useState('');
  const [entregueCompleto, setEntregueCompleto] = useState(true);

  // Simulador Frete State
  const [simPeso, setSimPeso] = useState(850);
  const [simVolM3, setSimVolM3] = useState(3.2);
  const [simValor, setSimValor] = useState(45000);
  const [simModalidade, setSimModalidade] = useState<ModalidadeFrete>('CIF');
  const [simUF, setSimUF] = useState('SP');
  const [simResultado, setSimResultado] = useState<any>(null);

  const prefix = useId();

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [resExp, resCar, resTra, resTab, resVei, resMot, resInd] = await Promise.all([
        safeFetchJson<{ expedicoes: Expedicao[] }>('/api/v1/expedicao?tipo=expedicoes', { headers: { 'x-empresa-id': empresaAtiva.id } }),
        safeFetchJson<{ cargas: CargaExpedicao[] }>('/api/v1/expedicao?tipo=cargas', { headers: { 'x-empresa-id': empresaAtiva.id } }),
        safeFetchJson<{ transportadoras: Transportadora[] }>('/api/v1/expedicao?tipo=transportadoras', { headers: { 'x-empresa-id': empresaAtiva.id } }),
        safeFetchJson<{ tabelasFrete: TabelaFrete[] }>('/api/v1/expedicao?tipo=tabelas_frete', { headers: { 'x-empresa-id': empresaAtiva.id } }),
        safeFetchJson<{ veiculos: VeiculoFrota[] }>('/api/v1/expedicao?tipo=veiculos', { headers: { 'x-empresa-id': empresaAtiva.id } }),
        safeFetchJson<{ motoristas: Motorista[] }>('/api/v1/expedicao?tipo=motoristas', { headers: { 'x-empresa-id': empresaAtiva.id } }),
        safeFetchJson<{ indicadores: IndicadoresLogisticaOTIF }>('/api/v1/expedicao?tipo=indicadores_otif', { headers: { 'x-empresa-id': empresaAtiva.id } }),
      ]);

      if (resExp.success && resExp.data?.expedicoes) {
        setExpedicoes(resExp.data.expedicoes);
        if (resExp.data.expedicoes.length > 0) {
          setSelectedExpedicao((prev) => prev || resExp.data!.expedicoes[0]);
        }
      }
      if (resCar.success && resCar.data?.cargas) setCargas(resCar.data.cargas);
      if (resTra.success && resTra.data?.transportadoras) setTransportadoras(resTra.data.transportadoras);
      if (resTab.success && resTab.data?.tabelasFrete) setTabelasFrete(resTab.data.tabelasFrete);
      if (resVei.success && resVei.data?.veiculos) setVeiculos(resVei.data.veiculos);
      if (resMot.success && resMot.data?.motoristas) setMotoristas(resMot.data.motoristas);
      if (resInd.success && resInd.data?.indicadores) setIndicadores(resInd.data.indicadores);
    } catch (err) {
      console.error('Erro ao carregar dados da expedição:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const executarAcao = async (acao: string, payload: any) => {
    try {
      const res = await safeFetchJson<{ expedicao?: Expedicao }>('/api/v1/expedicao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaAtiva.id,
        },
        body: JSON.stringify({ acao, payload }),
      });
      if (res.success) {
        await carregarDados();
        if (res.data?.expedicao) {
          setSelectedExpedicao(res.data.expedicao);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const simularFrete = async () => {
    try {
      const params = new URLSearchParams({
        tipo: 'simular_frete',
        modalidade: simModalidade,
        pesoKg: simPeso.toString(),
        volumeM3: simVolM3.toString(),
        valorMercadorias: simValor.toString(),
        ufDestino: simUF,
      });
      const res = await safeFetchJson<{ frete: any }>(`/api/v1/expedicao?${params.toString()}`, {
        headers: { 'x-empresa-id': empresaAtiva.id },
      });
      if (res.success && res.data?.frete) {
        setSimResultado(res.data.frete);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Status helper colors
  const getStatusBadge = (status: StatusExpedicao) => {
    const map: Record<StatusExpedicao, { bg: string; text: string; label: string }> = {
      PENDENTE: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', label: '1. Pedido Pronto' },
      EM_SEPARACAO: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: '2. Em Separação' },
      SEPARADO: { bg: 'bg-yellow-100 border-yellow-300', text: 'text-yellow-800', label: '3. Separado' },
      EM_CONFERENCIA: { bg: 'bg-purple-100 border-purple-300', text: 'text-purple-800', label: '4. Em Conferência' },
      CONFERIDO: { bg: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-800', label: '5. Conferido' },
      EMBALADO: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800', label: '6. Embalado (Volumes)' },
      DOCUMENTADO: { bg: 'bg-cyan-100 border-cyan-300', text: 'text-cyan-800', label: '7. Doc Emitida' },
      EM_CARGA: { bg: 'bg-teal-100 border-teal-300', text: 'text-teal-800', label: '8. Em Carga' },
      DESPACHADO: { bg: 'bg-sky-100 border-sky-300', text: 'text-sky-800', label: '9. Despachado' },
      EM_TRANSITO: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: '10. Em Trânsito' },
      ENTREGUE: { bg: 'bg-green-100 border-green-300', text: 'text-green-800', label: '11. Entregue (OTIF)' },
      ENTREGUE_PARCIAL: { bg: 'bg-orange-100 border-orange-300', text: 'text-orange-800', label: 'Entregue Parcial' },
      DEVOLVIDO: { bg: 'bg-rose-100 border-rose-300', text: 'text-rose-800', label: 'Devolvido/Recusa' },
      CANCELADO: { bg: 'bg-zinc-100 border-zinc-300', text: 'text-zinc-700', label: 'Cancelado' },
    };
    const s = map[status] || { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const expedicoesFiltradas = expedicoes.filter((e) => {
    if (statusFilter !== 'TODOS' && e.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.numeroExpedicao.toLowerCase().includes(q) ||
        e.numeroPedidoVenda.toLowerCase().includes(q) ||
        e.clienteRazaoSocial.toLowerCase().includes(q) ||
        (e.numeroNotaFiscal && e.numeroNotaFiscal.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div id={`${prefix}-expedicao-container`} className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Truck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Expedição, TMS & Logística de Cargas</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id={`${prefix}-btn-refresh`}
            onClick={carregarDados}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            id={`${prefix}-btn-nova-exp`}
            onClick={() => setModalNovaExpedicaoOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Expedição
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-0.5">
        {[
          { id: 'kpis', label: 'Torre de Controle & OTIF (BI)', icon: TrendingUp },
          { id: 'conferencia', label: 'Conferência Cega & Packing Station', icon: Barcode },
          { id: 'roteirizador', label: 'Roteirizador & Consolidação', icon: Compass },
          { id: 'cargas', label: 'Cargas & Romaneios', icon: Layers },
          { id: 'mdfe', label: 'Emissão MDF-e & Averbação', icon: FileText },
          { id: 'fluxo', label: 'Fluxo Operacional (Pipeline)', icon: Boxes },
          { id: 'tracking', label: 'Rastreamento & Ocorrências', icon: MapPin },
          { id: 'pod', label: 'Canhoto Digital (POD)', icon: FileCheck },
          { id: 'cotacoes', label: 'Cotação Comparativa Multi-Transportadora', icon: Calculator },
          { id: 'auditoria', label: 'Auditoria CT-e (Pre-Billing)', icon: Receipt },
          { id: 'reversa', label: 'Logística Reversa (RMA)', icon: RotateCcw },
          { id: 'docas', label: 'Agendamento de Docas (YMS)', icon: CalendarCheck },
          { id: 'cadastros', label: 'Transportadoras & Frota', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`${prefix}-tab-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TORRE DE CONTROLE, BI & OTIF AVANÇADO */}
      {activeSubTab === 'kpis' && indicadores && (
        <BiLogisticaAvancado
          empresaAtiva={empresaAtiva}
          expedicoes={expedicoes}
          transportadoras={transportadoras}
          indicadores={indicadores}
        />
      )}

      {/* TAB 2: PLANEJADOR DE ROTEIRIZAÇÃO & CONSOLIDAÇÃO DE CARGAS */}
      {activeSubTab === 'roteirizador' && (
        <RoteirizadorConsolidacao
          empresaAtiva={empresaAtiva}
          expedicoes={expedicoes}
          transportadoras={transportadoras}
          veiculos={veiculos}
          motoristas={motoristas}
          onCargaCriada={(novaCarga) => {
            setCargas((prev) => [novaCarga, ...prev]);
            carregarDados();
          }}
        />
      )}

      {/* TAB 2: FLUXO OPERACIONAL (PIPELINE) */}
      {activeSubTab === 'fluxo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Listagem Esquerda (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Expedições Fabris</h2>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                  {expedicoesFiltradas.length} ordens
                </span>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id={`${prefix}-input-search`}
                    type="text"
                    placeholder="Buscar por EXP, pedido, cliente, NF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  id={`${prefix}-select-status-filter`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="PENDENTE">1. Pedido Pronto</option>
                  <option value="EM_SEPARACAO">2. Em Separação</option>
                  <option value="SEPARADO">3. Separado</option>
                  <option value="EM_CONFERENCIA">4. Em Conferência</option>
                  <option value="CONFERIDO">5. Conferido</option>
                  <option value="EMBALADO">6. Embalado (Volumes)</option>
                  <option value="DOCUMENTADO">7. Documentado</option>
                  <option value="EM_TRANSITO">10. Em Trânsito</option>
                  <option value="ENTREGUE">11. Entregue</option>
                </select>
              </div>

              {/* Card List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {expedicoesFiltradas.map((exp) => {
                  const isSelected = selectedExpedicao?.id === exp.id;
                  return (
                    <div
                      key={exp.id}
                      id={`${prefix}-card-exp-${exp.id}`}
                      onClick={() => setSelectedExpedicao(exp)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-indigo-700">{exp.numeroExpedicao}</span>
                        {getStatusBadge(exp.status)}
                      </div>

                      <div className="text-xs font-semibold text-slate-900 truncate">{exp.clienteRazaoSocial}</div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                        <span>Ped: {exp.numeroPedidoVenda}</span>
                        <span>{exp.enderecoEntrega.cidade}/{exp.enderecoEntrega.uf}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          {exp.pesoBrutoTotalKg.toFixed(0)} kg ({exp.quantidadeTotalVolumes} vol)
                        </span>
                        <span className="font-semibold text-slate-800">
                          R$ {exp.valorMercadorias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detalhe & Ações do Fluxo (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedExpedicao ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
                {/* Header Expedição */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-900">{selectedExpedicao.numeroExpedicao}</h2>
                      {getStatusBadge(selectedExpedicao.status)}
                      <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                        {selectedExpedicao.modalidadeFrete}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pedido <strong>{selectedExpedicao.numeroPedidoVenda}</strong> • Cliente: {selectedExpedicao.clienteRazaoSocial}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`${prefix}-btn-abrir-romaneio`}
                      onClick={() => setModalRomaneioOpen(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Romaneio
                    </button>
                  </div>
                </div>

                {/* Pipeline visual de 8 etapas */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline de Expedição</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center text-[10px] font-semibold">
                    {[
                      { step: '1. Pedido', ok: true },
                      { step: '2. Picking', ok: ['EM_SEPARACAO', 'SEPARADO', 'EM_CONFERENCIA', 'CONFERIDO', 'EMBALADO', 'DOCUMENTADO', 'EM_CARGA', 'DESPACHADO', 'EM_TRANSITO', 'ENTREGUE'].includes(selectedExpedicao.status) },
                      { step: '3. Check', ok: ['CONFERIDO', 'EMBALADO', 'DOCUMENTADO', 'EM_CARGA', 'DESPACHADO', 'EM_TRANSITO', 'ENTREGUE'].includes(selectedExpedicao.status) },
                      { step: '4. Volumes', ok: ['EMBALADO', 'DOCUMENTADO', 'EM_CARGA', 'DESPACHADO', 'EM_TRANSITO', 'ENTREGUE'].includes(selectedExpedicao.status) },
                      { step: '5. Doc/NF', ok: ['DOCUMENTADO', 'EM_CARGA', 'DESPACHADO', 'EM_TRANSITO', 'ENTREGUE'].includes(selectedExpedicao.status) },
                      { step: '6. Carga', ok: ['EM_CARGA', 'DESPACHADO', 'EM_TRANSITO', 'ENTREGUE'].includes(selectedExpedicao.status) },
                      { step: '7. Trânsito', ok: ['DESPACHADO', 'EM_TRANSITO', 'ENTREGUE'].includes(selectedExpedicao.status) },
                      { step: '8. Entrega', ok: selectedExpedicao.status === 'ENTREGUE' },
                    ].map((st, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded-md border ${
                          st.ok
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        {st.step}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações contextuais de acordo com o status atual */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-indigo-600" />
                      Próxima Ação do Operador:
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedExpedicao.status === 'PENDENTE' && (
                      <button
                        id={`${prefix}-btn-iniciar-separacao`}
                        onClick={() => {
                          executarAcao('iniciar_separacao', {
                            expedicaoId: selectedExpedicao.id,
                            operadorId: 'op-01',
                            operadorNome,
                          });
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <ArrowRight className="w-4 h-4" />
                        1. Iniciar Separação (Picking List)
                      </button>
                    )}

                    {selectedExpedicao.status === 'EM_SEPARACAO' && (
                      <button
                        id={`${prefix}-btn-concluir-separacao`}
                        onClick={() => setModalSeparacaoOpen(true)}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        2. Confirmar Coleta de Itens
                      </button>
                    )}

                    {selectedExpedicao.status === 'SEPARADO' && (
                      <button
                        id={`${prefix}-btn-iniciar-conferencia`}
                        onClick={() => setModalConferenciaOpen(true)}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <Barcode className="w-4 h-4" />
                        3. Iniciar Conferência Cega / Bipagem
                      </button>
                    )}

                    {selectedExpedicao.status === 'EM_CONFERENCIA' && (
                      <button
                        id={`${prefix}-btn-finalizar-conferencia`}
                        onClick={() => setModalConferenciaOpen(true)}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        4. Finalizar Conferência & Pesagem
                      </button>
                    )}

                    {selectedExpedicao.status === 'CONFERIDO' && (
                      <button
                        id={`${prefix}-btn-gerar-volumes`}
                        onClick={() => setModalVolumesOpen(true)}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <Package className="w-4 h-4" />
                        5. Embalar, Gerar Volumes & Etiquetas GS1
                      </button>
                    )}

                    {selectedExpedicao.status === 'EMBALADO' && (
                      <button
                        id={`${prefix}-btn-gerar-doc`}
                        onClick={() => {
                          executarAcao('gerar_documentacao', {
                            expedicaoId: selectedExpedicao.id,
                            numeroNotaFiscal: `000.045.${Math.floor(100 + Math.random() * 900)}`,
                            serieNotaFiscal: '1',
                            chaveNFe: `3526081234567800019055001000045${Math.floor(100 + Math.random() * 900)}1982736411`,
                          });
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <FileText className="w-4 h-4" />
                        6. Emitir DANFE, CT-e & Romaneio
                      </button>
                    )}

                    {selectedExpedicao.status === 'DOCUMENTADO' && (
                      <button
                        id={`${prefix}-btn-despachar`}
                        onClick={() => setModalDespachoOpen(true)}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <Truck className="w-4 h-4" />
                        7. Despachar Carga / Iniciar Viagem
                      </button>
                    )}

                    {['DESPACHADO', 'EM_TRANSITO'].includes(selectedExpedicao.status) && (
                      <>
                        <button
                          id={`${prefix}-btn-confirmar-entrega`}
                          onClick={() => setModalEntregaOpen(true)}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          8. Registrar Comprovante / Canhoto (OTIF)
                        </button>
                        <button
                          id={`${prefix}-btn-ocorrencia`}
                          onClick={() => setModalOcorrenciaOpen(true)}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          Registrar Ocorrência / Avaria
                        </button>
                      </>
                    )}

                    {selectedExpedicao.status === 'ENTREGUE' && (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Entrega Finalizada e Canhoto Digitalizado Arquivado no Sistema
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalhes dos Itens */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Itens do Pedido & Quantidades</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2.5">Código / Descrição</th>
                          <th className="p-2.5 text-center">Qtd Pedida</th>
                          <th className="p-2.5 text-center">Separado</th>
                          <th className="p-2.5 text-center">Conferido</th>
                          <th className="p-2.5 text-right">Peso Total</th>
                          <th className="p-2.5 text-right">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedExpedicao.itens.map((it) => (
                          <tr key={it.id} className="hover:bg-slate-50/60">
                            <td className="p-2.5">
                              <span className="font-bold text-slate-900">{it.codigoProduto}</span>
                              <div className="text-[11px] text-slate-500">{it.descricao}</div>
                              {it.localizacaoEstoque && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                  Loc: {it.localizacaoEstoque}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-semibold text-slate-800">{it.quantidadePedida} {it.unidadeMedida}</td>
                            <td className="p-2.5 text-center font-medium text-amber-700">{it.quantidadeSeparada}</td>
                            <td className="p-2.5 text-center font-medium text-purple-700">{it.quantidadeConferida}</td>
                            <td className="p-2.5 text-right text-slate-700">{it.pesoTotalKg} kg</td>
                            <td className="p-2.5 text-right font-medium text-slate-900">
                              R$ {it.valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Volumes Embalados se houver */}
                {selectedExpedicao.volumes && selectedExpedicao.volumes.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Volumes & Etiquetas Térmicas (GS1-128)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedExpedicao.volumes.map((v) => (
                        <div key={v.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{v.codigoVolume}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                              {v.tipoEmbalagem}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 text-[11px]">
                            <span>Dim: {v.dimensoesCm.comprimento}x{v.dimensoesCm.largura}x{v.dimensoesCm.altura} cm</span>
                            <span>Vol: {v.volumeM3} m³</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 text-[11px]">
                            <span>Peso Bruto: <strong>{v.pesoBrutoKg} kg</strong></span>
                            <span>Cubado: <strong>{v.pesoCubadoKg} kg</strong></span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>Barcode: {v.codigoBarrasEtiqueta}</span>
                            <Barcode className="w-5 h-4 text-slate-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold">Selecione uma expedição para visualizar e operar o fluxo.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CARGAS & ROMANEIOS */}
      {activeSubTab === 'cargas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Cargas Consolidadas & Carregamentos</h2>
            <span className="text-xs text-slate-500">{cargas.length} cargas cadastradas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cargas.map((carga) => (
              <div key={carga.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-700">{carga.numeroCarga}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                    {carga.status}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900">{carga.rotaNome}</div>
                <div className="text-xs text-slate-600">
                  Transportadora/Veículo: <strong>{carga.transportadoraNome || carga.veiculoPlaca}</strong>
                </div>

                {/* Ocupação do Veículo */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Ocupação de Peso ({carga.pesoTotalCargaKg} / {carga.capacidadeVeiculoKg} kg):</span>
                    <span className="font-bold text-slate-900">{carga.ocupacaoPesoPercentual}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(carga.ocupacaoPesoPercentual, 100)}%` }}></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Ocupação de Cubagem ({carga.volumeTotalCargaM3} / {carga.capacidadeVeiculoM3} m³):</span>
                    <span className="font-bold text-slate-900">{carga.ocupacaoVolumePercentual}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min(carga.ocupacaoVolumePercentual, 100)}%` }}></div>
                  </div>
                </div>

                {/* Pedidos Embarcados */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Pedidos Embarcados no Romaneio:</span>
                  {carga.pedidosVinculados.map((pv, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-900">Parada {pv.ordemEntrega}: {pv.numeroPedido}</span>
                        <div className="text-[11px] text-slate-500">{pv.clienteNome} ({pv.cidadeUf})</div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-800">{pv.pesoKg} kg</span>
                        <div className="text-[10px] text-slate-500">{pv.quantidadeVolumes} vol</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RASTREAMENTO & OCORRÊNCIAS */}
      {activeSubTab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              Torre de Rastreamento (Linha do Tempo de Tracking)
            </h2>

            {selectedExpedicao ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedExpedicao.numeroExpedicao}</h3>
                    <p className="text-xs text-slate-500">Destino: {selectedExpedicao.enderecoEntrega.cidade}/{selectedExpedicao.enderecoEntrega.uf}</p>
                  </div>
                  {getStatusBadge(selectedExpedicao.status)}
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedExpedicao.rastreamento.map((ev, idx) => (
                    <div key={ev.id || idx} className="relative">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{ev.etapa}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          {new Date(ev.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{ev.descricao}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {ev.cidade}/{ev.uf} {ev.responsavelNome ? `• Resp: ${ev.responsavelNome}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-400">
                Selecione uma expedição para visualizar o rastreamento.
              </div>
            )}
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Ocorrências de Transporte & Devoluções
            </h2>

            <div className="space-y-3">
              {expedicoes
                .flatMap((e) => e.ocorrencias)
                .map((oco) => (
                  <div key={oco.id} className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800">{oco.codigoOcorrencia} ({oco.tipo})</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                        {oco.gravidade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{oco.descricaoDetalhada}</p>
                    {oco.acaoTomada && (
                      <div className="text-xs bg-slate-50 p-2 rounded-md border border-slate-100 text-slate-600">
                        <strong>Ação:</strong> {oco.acaoTomada}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>Logística Reversa: <strong>{oco.gerouLogisticaReversa ? 'SIM' : 'NÃO'}</strong></span>
                      <span>RNC Vinculada: <strong>{oco.rncQualidadeId || 'N/A'}</strong></span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CADASTROS DE FRETE & FROTA */}
      {activeSubTab === 'cadastros' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transportadoras */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Transportadoras Homologadas
            </h2>
            <div className="space-y-3">
              {transportadoras.map((t) => (
                <div key={t.id} className="p-3 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.nomeFantasia}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {t.taxaPontualidadePercentual}% Pontualidade
                    </span>
                  </div>
                  <div className="text-slate-600">{t.razaoSocial} • CNPJ: {t.cnpj}</div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>RNTRC: {t.rntrc}</span>
                    <span>Prazo Médio: {t.prazoMedioDias} dias</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Frota Própria & Motoristas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-600" />
              Frota Própria & Motoristas
            </h2>
            <div className="space-y-3">
              {veiculos.map((v) => (
                <div key={v.id} className="p-3 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{v.placa} - {v.modelo}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${v.status === 'DISPONIVEL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {v.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Capacidade: <strong>{v.capacidadeCargaKg} kg</strong> ({v.capacidadeVolumeM3} m³)</span>
                    <span>Km Atual: {v.kmAtual.toLocaleString('pt-BR')} km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CONFERÊNCIA CEGA & PACKING STATION (GARGALO OPERACIONAL 1) */}
      {activeSubTab === 'conferencia' && (
        <ConferenciaCegaBipagem
          empresaAtiva={empresaAtiva}
          expedicoes={expedicoes}
          onFinalizarConferencia={async (expId, pesoKg, volumes) => {
            await executarAcao('finalizar_conferencia', {
              expedicaoId: expId,
              pesoAferidoBalancaKg: pesoKg,
              volumes,
            });
          }}
          onImprimirEtiqueta={(vol) => {
            window.print();
          }}
        />
      )}

      {/* TAB: EMISSÃO MDF-E & ROMANEIOS UNIFICADOS (GARGALO OPERACIONAL 2) */}
      {activeSubTab === 'mdfe' && (
        <EmissaoMdfeRomaneio
          empresaAtiva={empresaAtiva}
          cargas={cargas}
          transportadoras={transportadoras}
          veiculos={veiculos}
          motoristas={motoristas}
        />
      )}

      {/* TAB: CANHOTO DIGITAL & COMPROVAÇÃO POD (GARGALO OPERACIONAL 3) */}
      {activeSubTab === 'pod' && (
        <CanhotoDigitalPod
          empresaAtiva={empresaAtiva}
          expedicoes={expedicoes}
          onConfirmarEntregaPod={async (expId, podData) => {
            await executarAcao('registrar_entrega_pod', {
              expedicaoId: expId,
              pod: podData,
            });
          }}
        />
      )}

      {/* TAB 6: COTAÇÕES COMPARATIVAS MULTI-TRANSPORTADORA */}
      {activeSubTab === 'cotacoes' && (
        <CotacaoComparativaFrete
          empresaAtiva={empresaAtiva}
          transportadoras={transportadoras}
          tabelasFrete={tabelasFrete}
        />
      )}

      {/* TAB 7: AUDITORIA DE FATURAS & CONCILIAÇÃO CT-E */}
      {activeSubTab === 'auditoria' && (
        <AuditoriaFaturasFrete
          empresaAtiva={empresaAtiva}
          transportadoras={transportadoras}
        />
      )}

      {/* TAB 8: LOGÍSTICA REVERSA & DEVOLUÇÕES (RMA) */}
      {activeSubTab === 'reversa' && (
        <GestaoLogisticaReversa
          empresaAtiva={empresaAtiva}
        />
      )}

      {/* TAB 9: AGENDAMENTO DE DOCAS & GESTÃO DE PÁTIO (YMS) */}
      {activeSubTab === 'docas' && (
        <AgendamentoDocaPatio
          empresaAtiva={empresaAtiva}
          transportadoras={transportadoras}
          veiculos={veiculos}
          motoristas={motoristas}
        />
      )}

      {/* MODAL: CONFERÊNCIA & BIPAGEM */}
      {modalConferenciaOpen && selectedExpedicao && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Barcode className="w-5 h-5 text-purple-600" />
                Conferência de Itens & Pesagem
              </h3>
              <button onClick={() => setModalConferenciaOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Simular Scanner de Código de Barras:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Bipar código de barras..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="flex-1 p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                  <button
                    onClick={() => {
                      if (selectedExpedicao.itens.length > 0) {
                        const it = selectedExpedicao.itens[0];
                        executarAcao('bipar_item_conferencia', {
                          expedicaoId: selectedExpedicao.id,
                          codigoProduto: it.codigoProduto,
                          codigoBarrasLido: barcodeInput || '7891234500018',
                          quantidadeLida: 1,
                        });
                        setBarcodeInput('');
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                  >
                    Bipar +1
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Peso Aferido na Balança Dinâmica (kg):</label>
                <input
                  type="number"
                  value={pesoAferido || selectedExpedicao.pesoBrutoTotalKg}
                  onChange={(e) => setPesoAferido(Number(e.target.value))}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModalConferenciaOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await executarAcao('finalizar_conferencia', {
                    expedicaoId: selectedExpedicao.id,
                    pesoAferidoBalancaKg: pesoAferido || selectedExpedicao.pesoBrutoTotalKg,
                  });
                  setModalConferenciaOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
              >
                Aprovar & Finalizar Conferência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GERAR VOLUMES & ETIQUETAS */}
      {modalVolumesOpen && selectedExpedicao && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Geração de Volumes & Etiquetas GS1
              </h3>
              <button onClick={() => setModalVolumesOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo de Embalagem:</label>
                <select
                  value={tipoEmbalagem}
                  onChange={(e) => setTipoEmbalagem(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="PALLET_MADEIRA">Pallet PBR (Madeira)</option>
                  <option value="CAIXA_PAPELAO">Caixa de Papelão Reforçada</option>
                  <option value="ENGRADADO_ACO">Engradado Metálico</option>
                  <option value="TAMBOR">Tambor Industrial</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lacre de Segurança:</label>
                <input
                  type="text"
                  value={lacreVol}
                  onChange={(e) => setLacreVol(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Comprimento (cm):</label>
                <input
                  type="number"
                  value={compCm}
                  onChange={(e) => setCompCm(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Largura (cm):</label>
                <input
                  type="number"
                  value={largCm}
                  onChange={(e) => setLargCm(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Altura (cm):</label>
                <input
                  type="number"
                  value={altCm}
                  onChange={(e) => setAltCm(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Peso Bruto (kg):</label>
                <input
                  type="number"
                  value={pesoBrutoVol}
                  onChange={(e) => setPesoBrutoVol(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModalVolumesOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const volumesPayload = [
                    {
                      tipoEmbalagem,
                      dimensoesCm: { comprimento: compCm, largura: largCm, altura: altCm },
                      pesoLiquidoKg: pesoLiqVol,
                      pesoBrutoKg: pesoBrutoVol,
                      itensContidos: selectedExpedicao.itens.map((it) => ({
                        expedicaoItemId: it.id,
                        quantidade: it.quantidadePedida,
                      })),
                      lacreSegurancaNumero: lacreVol,
                    },
                  ];
                  await executarAcao('gerar_volumes', {
                    expedicaoId: selectedExpedicao.id,
                    volumes: volumesPayload,
                  });
                  setModalVolumesOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Gerar Volumes & Imprimir Etiquetas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR COMPROVANTE DE ENTREGA / CANHOTO */}
      {modalEntregaOpen && selectedExpedicao && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Registrar Comprovante de Entrega (Canhoto)
              </h3>
              <button onClick={() => setModalEntregaOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome Completo do Recebedor:</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo Nogueira"
                  value={recebedorNome}
                  onChange={(e) => setRecebedorNome(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Documento (RG / CPF):</label>
                  <input
                    type="text"
                    placeholder="Ex: 28.910.455-8"
                    value={recebedorDoc}
                    onChange={(e) => setRecebedorDoc(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cargo / Função:</label>
                  <input
                    type="text"
                    value={cargoRecebedor}
                    onChange={(e) => setCargoRecebedor(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ressalvas Anotadas no Canhoto:</label>
                <input
                  type="text"
                  placeholder="Deixar em branco se 100% perfeito"
                  value={ressalvasEntrega}
                  onChange={(e) => setRessalvasEntrega(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id={`${prefix}-check-completo`}
                  checked={entregueCompleto}
                  onChange={(e) => setEntregueCompleto(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`${prefix}-check-completo`} className="font-semibold text-slate-800 cursor-pointer">
                  Carga entregue 100% completa sem faltas ou avarias (In-Full Conforme)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModalEntregaOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await executarAcao('confirmar_entrega', {
                    expedicaoId: selectedExpedicao.id,
                    dataHoraEntrega: new Date().toISOString(),
                    nomeRecebedor: recebedorNome || 'Recebedor Autorizado',
                    documentoRecebedor: recebedorDoc || 'RG 00.000.000-0',
                    parentescoOuCargo: cargoRecebedor,
                    ressalvasCliente: ressalvasEntrega,
                    entregueCompleto,
                  });
                  setModalEntregaOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-xs"
              >
                Confirmar Canhoto & Calcular OTIF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ROMANEIO DE CARGA */}
      {modalRomaneioOpen && selectedExpedicao && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Romaneio de Expedição & Carga</h3>
                <p className="text-xs text-slate-500">{empresaAtiva.nomeFantasia} • CNPJ: {empresaAtiva.cnpj}</p>
              </div>
              <button onClick={() => setModalRomaneioOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Expedição:</strong> {selectedExpedicao.numeroExpedicao}</div>
                <div><strong>Pedido Venda:</strong> {selectedExpedicao.numeroPedidoVenda}</div>
                <div><strong>Nota Fiscal:</strong> {selectedExpedicao.numeroNotaFiscal || 'Aguardando Emissão'}</div>
                <div><strong>Modalidade Frete:</strong> {selectedExpedicao.modalidadeFrete}</div>
                <div><strong>Destinatário:</strong> {selectedExpedicao.clienteRazaoSocial}</div>
                <div><strong>Destino:</strong> {selectedExpedicao.enderecoEntrega.cidade}/{selectedExpedicao.enderecoEntrega.uf}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-600">Itens Embarcados:</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qtd</th>
                      <th className="p-2 text-right">Peso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedExpedicao.itens.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2">{it.codigoProduto} - {it.descricao}</td>
                        <td className="p-2 text-center">{it.quantidadePedida} {it.unidadeMedida}</td>
                        <td className="p-2 text-right">{it.pesoTotalKg} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setModalRomaneioOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
                Fechar
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs">
                <Printer className="w-4 h-4" />
                Imprimir Romaneio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
