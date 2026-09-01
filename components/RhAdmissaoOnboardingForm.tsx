'use client';

import React, { useState } from 'react';
import { UserPlus, ShieldCheck, CheckSquare, BadgeCheck, AlertCircle } from 'lucide-react';
import { admitirFuncionarioComOnboardingAction } from '../app/actions/rh-actions';

interface Props {
  empresaAtiva: { id: string; nome: string };
  onSuccess?: () => void;
}

export function RhAdmissaoOnboardingForm({ empresaAtiva, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('TRT-1001');
  const [setor, setSetor] = useState('CORTE_DOBRA');
  const [cargo, setCargo] = useState('OPERADOR_LASER');
  const [custoHora, setCustoHora] = useState('38.50');
  const [dataAdmissao, setDataAdmissao] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const res = await admitirFuncionarioComOnboardingAction({
      empresaId: empresaAtiva.id,
      nomeCompleto: nome,
      cpf,
      matricula,
      cargoId: cargo,
      setorId: setor,
      dataAdmissao,
      custoHoraReal: parseFloat(custoHora) || 0,
    });

    setLoading(false);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Colaborador admitido com sucesso! ${res.data?.tarefasOnboardingCriadas} tarefas de onboarding industrial geradas automaticamente.`,
      });
      setNome('');
      setCpf('');
      if (onSuccess) onSuccess();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Falha ao processar admissão.',
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Admissão de Colaborador Industrial</h2>
            <p className="text-xs text-slate-500">
              Empresa vinculada: <strong className="text-slate-700">{empresaAtiva.nome}</strong>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
          <BadgeCheck className="w-4 h-4" /> Checklist Automático Ativo
        </span>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg text-sm mb-6 flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Eduardo Silveira"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">CPF *</label>
            <input
              type="text"
              required
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Matrícula Operacional *</label>
            <input
              type="text"
              required
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Data de Admissão *</label>
            <input
              type="date"
              required
              value={dataAdmissao}
              onChange={(e) => setDataAdmissao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Setor Fabril</label>
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="CORTE_DOBRA">Corte & Dobra (CNC / Laser)</option>
              <option value="SOLDA_CALDEIRARIA">Solda & Caldeiraria</option>
              <option value="USINAGEM">Usinagem & Torno</option>
              <option value="PINTURA">Pintura & Tratamento</option>
              <option value="MONTAGEM">Montagem Mecânica</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Custo-Hora Real Ponderado (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={custoHora}
              onChange={(e) => setCustoHora(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400">Utilizado pelo motor de custeio por ordem de produção.</span>
          </div>
        </div>

        {/* Pré-visualização do Checklist de Integração */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <CheckSquare className="w-4 h-4 text-blue-600" /> Checklist de Entrada & Segurança Obrigatória
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Entrega e Termo de EPI com número de CA registrado
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Treinamento e autorização de máquina (NR-12 / NR-06)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Inclusão na matriz de competências e alocação de turno
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Processando Admissão...' : 'Concluir Admissão & Gerar Onboarding'}
          </button>
        </div>
      </form>
    </div>
  );
}
