'use client';

import React, { useState } from 'react';
import { Clock, Play, CheckCircle2 } from 'lucide-react';
import { registrarApontamentoHorasAction } from '../app/actions/rh-actions';

interface Props {
  empresaAtiva: { id: string; nome: string };
  onApontamentoConcluido?: () => void;
}

export function RhApontadorHorasProducao({ empresaAtiva, onApontamentoConcluido }: Props) {
  const [opNumero, setOpNumero] = useState('OP-2026-0421');
  const [funcionarioId] = useState('FUNC-001');
  const [tipo, setTipo] = useState<'PRODUCAO_DIRETA' | 'SETUP' | 'MANUTENCAO' | 'PARADA_FABRIL'>('PRODUCAO_DIRETA');
  const [minutos, setMinutos] = useState<number>(120);
  const [custoHora] = useState<number>(45.0);
  const [loading, setLoading] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const custoTotalCalculado = ((minutos / 60) * custoHora).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagemSucesso(null);

    const res = await registrarApontamentoHorasAction({
      empresaId: empresaAtiva.id,
      funcionarioId,
      ordemProducaoId: opNumero,
      tipoApontamento: tipo,
      horaInicio: new Date().toISOString(),
      horaFim: new Date().toISOString(),
      duracaoMinutos: minutos,
      custoHoraAplicado: custoHora,
    });

    setLoading(false);
    if (res.success) {
      setMensagemSucesso(`Apontamento de ${minutos} min alocado à OP ${opNumero} (${custoTotalCalculado} de Custo MOD).`);
      if (onApontamentoConcluido) onApontamentoConcluido();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Apontamento Rápido de Horas (MOD)</h3>
          <p className="text-xs text-slate-500">Custeio direto da Ordem de Produção e Centro de Custo</p>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3.5 mb-5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ordem de Produção (OP)</label>
          <input
            type="text"
            required
            value={opNumero}
            onChange={(e) => setOpNumero(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Atividade</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'PRODUCAO_DIRETA' | 'SETUP' | 'MANUTENCAO' | 'PARADA_FABRIL')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="PRODUCAO_DIRETA">Produção Direta</option>
              <option value="SETUP">Setup de Máquina</option>
              <option value="MANUTENCAO">Manutenção Autônoma</option>
              <option value="PARADA_FABRIL">Parada / Espera</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Duração (Minutos)</label>
            <input
              type="number"
              min={1}
              required
              value={minutos}
              onChange={(e) => setMinutos(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Resumo do Custo Alocado */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Custo MOD Apropriado</span>
            <span className="text-xl font-mono font-extrabold text-amber-400">{custoTotalCalculado}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Tempo Total</span>
            <span className="text-sm font-semibold font-mono text-slate-200">{(minutos / 60).toFixed(2)} horas</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          {loading ? 'Registrando Custo...' : 'Salvar Apontamento Operacional'}
        </button>
      </form>
    </div>
  );
}
