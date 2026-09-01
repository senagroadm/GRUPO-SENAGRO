'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Truck,
  Plus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  CalendarCheck,
  User,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';
import { Empresa } from '@/backend/core/types/company';
import { Transportadora, VeiculoFrota, Motorista } from '@/backend/modules/expedicao/expedicao-types';

export interface AgendamentoDoca {
  id: string;
  numeroProtocolo: string;
  tipoOperacao: 'CARREGAMENTO_EXPEDICAO' | 'DESCARGA_MATERIA_PRIMA' | 'LOGISTICA_REVERSA';
  numeroDoca: 'DOCA 01 (Sider/Baú)' | 'DOCA 02 (Baú Refrigerado/Seco)' | 'DOCA 03 (Prancha/Pesados)' | 'DOCA 04 (Express/VUC)';
  transportadoraNome: string;
  veiculoPlaca: string;
  motoristaNome: string;
  motoristaTelefone: string;
  dataAgendamento: string;
  horarioInicio: string;
  horarioFim: string;
  tempoPrevistoMinutos: number;
  statusDoca: 'AGENDADO' | 'CHEGOU_NA_PORTARIA' | 'EM_DOCAGEM' | 'CONCLUIDO' | 'ATRASADO_NO_SHOW';
  pedidosOuNfs: string;
  pesoTotalEstimadoKg: number;
  quantidadeVolumes: number;
}

interface AgendamentoDocaPatioProps {
  empresaAtiva: Empresa;
  transportadoras: Transportadora[];
  veiculos: VeiculoFrota[];
  motoristas: Motorista[];
}

const AGENDAMENTOS_MOCK_INICIAL: AgendamentoDoca[] = [
  {
    id: 'DOC-001',
    numeroProtocolo: 'PROT-DOC-8910',
    tipoOperacao: 'CARREGAMENTO_EXPEDICAO',
    numeroDoca: 'DOCA 01 (Sider/Baú)',
    transportadoraNome: 'Rodonaves Transportes Ltda',
    veiculoPlaca: 'BRA2E19 (Truck 6x2)',
    motoristaNome: 'Marcos Antônio Ribeiro',
    motoristaTelefone: '(16) 99876-5432',
    dataAgendamento: '2026-09-01',
    horarioInicio: '08:00',
    horarioFim: '09:30',
    tempoPrevistoMinutos: 90,
    statusDoca: 'CONCLUIDO',
    pedidosOuNfs: 'CARGA-SP-INT-01 (PV-00891, PV-00893)',
    pesoTotalEstimadoKg: 4850,
    quantidadeVolumes: 45,
  },
  {
    id: 'DOC-002',
    numeroProtocolo: 'PROT-DOC-8911',
    tipoOperacao: 'CARREGAMENTO_EXPEDICAO',
    numeroDoca: 'DOCA 02 (Baú Refrigerado/Seco)',
    transportadoraNome: 'Braspress Transportes Urgentes',
    veiculoPlaca: 'FGH9I01 (Carreta Sider)',
    motoristaNome: 'Luciano Silveira Pinto',
    motoristaTelefone: '(11) 98765-4321',
    dataAgendamento: '2026-09-01',
    horarioInicio: '10:00',
    horarioFim: '12:00',
    tempoPrevistoMinutos: 120,
    statusDoca: 'EM_DOCAGEM',
    pedidosOuNfs: 'CARGA-PR-SUL-02 (PV-00892, PV-00894)',
    pesoTotalEstimadoKg: 12400,
    quantidadeVolumes: 88,
  },
  {
    id: 'DOC-003',
    numeroProtocolo: 'PROT-DOC-8912',
    tipoOperacao: 'LOGISTICA_REVERSA',
    numeroDoca: 'DOCA 04 (Express/VUC)',
    transportadoraNome: 'Jamef Encomendas Urgentes',
    veiculoPlaca: 'ABC1D23 (VUC 3/4)',
    motoristaNome: 'Rogério Lima',
    motoristaTelefone: '(34) 99123-4567',
    dataAgendamento: '2026-09-01',
    horarioInicio: '13:30',
    horarioFim: '14:30',
    tempoPrevistoMinutos: 60,
    statusDoca: 'CHEGOU_NA_PORTARIA',
    pedidosOuNfs: 'RMA-0891 (Devolução Garantia)',
    pesoTotalEstimadoKg: 350,
    quantidadeVolumes: 3,
  },
  {
    id: 'DOC-004',
    numeroProtocolo: 'PROT-DOC-8913',
    tipoOperacao: 'CARREGAMENTO_EXPEDICAO',
    numeroDoca: 'DOCA 03 (Prancha/Pesados)',
    transportadoraNome: 'Expresso São Miguel',
    veiculoPlaca: 'JKL3M45 (Carreta Prancha)',
    motoristaNome: 'Valdir Fagundes',
    motoristaTelefone: '(41) 99988-7766',
    dataAgendamento: '2026-09-01',
    horarioInicio: '15:00',
    horarioFim: '17:00',
    tempoPrevistoMinutos: 120,
    statusDoca: 'AGENDADO',
    pedidosOuNfs: 'CARGA-MG-TRIANGULO (PV-00895, PV-00896)',
    pesoTotalEstimadoKg: 18500,
    quantidadeVolumes: 14,
  },
];

export function AgendamentoDocaPatio({
  empresaAtiva,
  transportadoras,
  veiculos,
  motoristas,
}: AgendamentoDocaPatioProps) {
  const [agendamentos, setAgendamentos] = useState<AgendamentoDoca[]>(AGENDAMENTOS_MOCK_INICIAL);
  const [modalNovoAgendamento, setModalNovoAgendamento] = useState(false);

  // Form de Agendamento
  const [docaSel, setDocaSel] = useState<AgendamentoDoca['numeroDoca']>('DOCA 01 (Sider/Baú)');
  const [operacao, setOperacao] = useState<AgendamentoDoca['tipoOperacao']>('CARREGAMENTO_EXPEDICAO');
  const [transpNome, setTranspNome] = useState(transportadoras[0]?.nomeFantasia || 'Rodonaves');
  const [placa, setPlaca] = useState('BRA2E19');
  const [motorista, setMotorista] = useState('Marcos Antônio Ribeiro');
  const [horaInicio, setHoraInicio] = useState('14:00');
  const [horaFim, setHoraFim] = useState('15:30');
  const [pedidos, setPedidos] = useState('PV-00912 / PV-00913');
  const [pesoKg, setPesoKg] = useState(3800);
  const [volumes, setVolumes] = useState(24);

  const atualizarStatusDoca = (id: string, status: AgendamentoDoca['statusDoca']) => {
    setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, statusDoca: status } : a)));
  };

  const getStatusDocaBadge = (status: AgendamentoDoca['statusDoca']) => {
    switch (status) {
      case 'AGENDADO':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full text-[10px]">Agendado</span>;
      case 'CHEGOU_NA_PORTARIA':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">Na Portaria</span>;
      case 'EM_DOCAGEM':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-full text-[10px] animate-pulse">Em Carregamento</span>;
      case 'CONCLUIDO':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">Concluído</span>;
      case 'ATRASADO_NO_SHOW':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-full text-[10px]">Atrasado / No-Show</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Agendamento de Docas & Gestão de Pátio (YMS)
              <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-extrabold rounded-full">
                Controle de Estadia (Free-Time)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Grade horária de docagem de caminhões para evitar filas na portaria, cobranças de diária de estadia e gargalos de expedição.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNovoAgendamento(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Reservar Janela de Doca
        </button>
      </div>

      {/* Visão de Ocupação das 4 Docas da Fábrica */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { nome: 'DOCA 01 (Sider/Baú)', status: 'LIVRE', ocupante: 'Disponível para próximo agendamento', cor: 'border-emerald-200 bg-emerald-50/30' },
          { nome: 'DOCA 02 (Baú Refrigerado/Seco)', status: 'OCUPADA', ocupante: 'Braspress • FGH9I01 (Em Carregamento)', cor: 'border-purple-200 bg-purple-50/40' },
          { nome: 'DOCA 03 (Prancha/Pesados)', status: 'RESERVADA', ocupante: 'Expresso São Miguel • 15:00', cor: 'border-blue-200 bg-blue-50/30' },
          { nome: 'DOCA 04 (Express/VUC)', status: 'AGUARDANDO DOCAGEM', ocupante: 'Jamef • ABC1D23 (Na Portaria)', cor: 'border-amber-200 bg-amber-50/40' },
        ].map((d, i) => (
          <div key={i} className={`border rounded-xl p-4 shadow-xs space-y-2 ${d.cor}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{d.nome}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                d.status === 'LIVRE' ? 'bg-emerald-100 text-emerald-800' :
                d.status === 'OCUPADA' ? 'bg-purple-100 text-purple-800' :
                d.status === 'RESERVADA' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {d.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{d.ocupante}</p>
          </div>
        ))}
      </div>

      {/* Grade Diária de Agendamentos */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Grade de Janelas de Carga & Descarga de Hoje ({agendamentos.length} slots)
          </h3>
          <span className="text-xs text-slate-400">Tempo Médio de Carregamento: 1h 25min</span>
        </div>

        <div className="divide-y divide-slate-100">
          {agendamentos.map((ag) => (
            <div key={ag.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-bold text-xs rounded">
                    {ag.horarioInicio} - {ag.horarioFim}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">{ag.numeroDoca}</span>
                  {getStatusDocaBadge(ag.statusDoca)}
                </div>

                <div className="text-xs text-slate-700">
                  <strong>{ag.transportadoraNome}</strong> • Veículo: {ag.veiculoPlaca} • Motorista: {ag.motoristaNome} ({ag.motoristaTelefone})
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>Carga/Documentos: <strong>{ag.pedidosOuNfs}</strong></span>
                  <span>•</span>
                  <span>Peso: <strong>{ag.pesoTotalEstimadoKg} kg</strong> ({ag.quantidadeVolumes} vol)</span>
                  <span>•</span>
                  <span>Protocolo: {ag.numeroProtocolo}</span>
                </div>
              </div>

              {/* Botões de Transição de Pátio */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                {ag.statusDoca === 'AGENDADO' && (
                  <button
                    onClick={() => atualizarStatusDoca(ag.id, 'CHEGOU_NA_PORTARIA')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Registrar Entrada Portaria
                  </button>
                )}

                {ag.statusDoca === 'CHEGOU_NA_PORTARIA' && (
                  <button
                    onClick={() => atualizarStatusDoca(ag.id, 'EM_DOCAGEM')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Posicionar na Doca
                  </button>
                )}

                {ag.statusDoca === 'EM_DOCAGEM' && (
                  <button
                    onClick={() => atualizarStatusDoca(ag.id, 'CONCLUIDO')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Liberar Veículo & Doca
                  </button>
                )}

                {ag.statusDoca === 'CONCLUIDO' && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Carregamento Finalizado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Novo Agendamento de Doca */}
      {modalNovoAgendamento && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                Agendar Janela de Doca de Expedição
              </h3>
              <button onClick={() => setModalNovoAgendamento(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Doca de Carregamento:</label>
                <select
                  value={docaSel}
                  onChange={(e) => setDocaSel(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="DOCA 01 (Sider/Baú)">DOCA 01 (Sider/Baú)</option>
                  <option value="DOCA 02 (Baú Refrigerado/Seco)">DOCA 02 (Baú Refrigerado/Seco)</option>
                  <option value="DOCA 03 (Prancha/Pesados)">DOCA 03 (Prancha/Pesados)</option>
                  <option value="DOCA 04 (Express/VUC)">DOCA 04 (Express/VUC)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo de Operação:</label>
                <select
                  value={operacao}
                  onChange={(e) => setOperacao(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="CARREGAMENTO_EXPEDICAO">Carregamento Expedição</option>
                  <option value="DESCARGA_MATERIA_PRIMA">Descarga Matéria-Prima</option>
                  <option value="LOGISTICA_REVERSA">Logística Reversa / Devoluções</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transportadora:</label>
                <input
                  type="text"
                  value={transpNome}
                  onChange={(e) => setTranspNome(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Placa do Veículo:</label>
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Horário Início:</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Horário Término:</label>
                <input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Nome e Contato do Motorista:</label>
                <input
                  type="text"
                  value={motorista}
                  onChange={(e) => setMotorista(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Pedidos ou Romaneio Vinculado:</label>
                <input
                  type="text"
                  value={pedidos}
                  onChange={(e) => setPedidos(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModalNovoAgendamento(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
                Cancelar
              </button>
              <button
                onClick={() => {
                  const novo: AgendamentoDoca = {
                    id: `DOC-00${agendamentos.length + 1}`,
                    numeroProtocolo: `PROT-DOC-${Math.floor(1000 + Math.random() * 9000)}`,
                    tipoOperacao: operacao,
                    numeroDoca: docaSel,
                    transportadoraNome: transpNome,
                    veiculoPlaca: placa,
                    motoristaNome: motorista,
                    motoristaTelefone: '(16) 99876-0000',
                    dataAgendamento: new Date().toISOString().split('T')[0],
                    horarioInicio: horaInicio,
                    horarioFim: horaFim,
                    tempoPrevistoMinutos: 90,
                    statusDoca: 'AGENDADO',
                    pedidosOuNfs: pedidos,
                    pesoTotalEstimadoKg: pesoKg,
                    quantidadeVolumes: volumes,
                  };
                  setAgendamentos((prev) => [...prev, novo]);
                  setModalNovoAgendamento(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
