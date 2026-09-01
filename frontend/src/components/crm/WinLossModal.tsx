'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { updateOpportunityOutcome, OpportunityOutcomeStatus } from '@/app/actions/crm-advanced-actions';

export interface WinLossModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityTitle?: string;
  onSuccess?: (status: OpportunityOutcomeStatus) => void;
}

export function WinLossModal({
  isOpen,
  onClose,
  opportunityId,
  opportunityTitle,
  onSuccess,
}: WinLossModalProps) {
  const [status, setStatus] = useState<OpportunityOutcomeStatus>('won');
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (status === 'lost' && !reason.trim()) {
      setErrorMessage('Por favor, informe o motivo ou justificativa para a perda da oportunidade.');
      return;
    }

    try {
      setIsLoading(true);

      const result = await updateOpportunityOutcome({
        opportunityId,
        status,
        reason: reason.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Falha ao atualizar o status da oportunidade.');
        return;
      }

      if (onSuccess) {
        onSuccess(status);
      }

      // Limpa os estados e fecha o modal
      setReason('');
      setStatus('won');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setErrorMessage(null);
    setReason('');
    onClose();
  };

  return (
    <div
      id="crm-win-loss-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="crm-win-loss-modal-card"
        className="relative w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl transition-all"
      >
        {/* Botão Fechar */}
        <button
          id="btn-close-win-loss-modal"
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Registrar Desfecho da Oportunidade
          </h2>
          {opportunityTitle && (
            <p className="mt-0.5 text-xs text-slate-500 truncate">
              Oportunidade: <span className="font-semibold text-slate-700">{opportunityTitle}</span>
            </p>
          )}
        </div>

        {/* Alerta de Erro */}
        {errorMessage && (
          <div
            id="win-loss-error-alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Status (Ganho / Perdido) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Selecione o Resultado
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-select-won"
                onClick={() => {
                  setStatus('won');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all cursor-pointer ${
                  status === 'won'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`h-5 w-5 ${status === 'won' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Ganho (Won)
              </button>

              <button
                type="button"
                id="btn-select-lost"
                onClick={() => {
                  setStatus('lost');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all cursor-pointer ${
                  status === 'lost'
                    ? 'border-red-600 bg-red-50 text-red-700 shadow-xs ring-2 ring-red-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className={`h-5 w-5 ${status === 'lost' ? 'text-red-600' : 'text-slate-400'}`} />
                Perdido (Lost)
              </button>
            </div>
          </div>

          {/* Textarea para Justificativa / Motivo */}
          <div>
            <label
              htmlFor="win-loss-reason"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
            >
              {status === 'lost' ? (
                <span>
                  Motivo da Perda <span className="text-red-500">*</span>
                </span>
              ) : (
                <span>Observações do Fechamento (Opcional)</span>
              )}
            </label>
            <textarea
              id="win-loss-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                status === 'lost'
                  ? 'Descreva o motivo (ex: Preço 15% acima do concorrente X, prazo de entrega superior a 30 dias, cancelamento do projeto pelo cliente)...'
                  : 'Descreva detalhes da negociação, condições acordadas ou observações para o faturamento...'
              }
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              required={status === 'lost'}
            />
          </div>

          {/* Ações do Rodapé */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="btn-cancel-win-loss"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btn-submit-win-loss"
              disabled={isLoading}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer ${
                status === 'won'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {status === 'won' ? 'Confirmar Ganho' : 'Confirmar Perda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
