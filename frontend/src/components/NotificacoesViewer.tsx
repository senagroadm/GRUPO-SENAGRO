import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Calendar, User } from 'lucide-react';

const mockTarefas = [
  { id: 1, titulo: "Aprovar folha de pagamento", responsavel: "RH", prazo: "28/08/2026", prioridade: "Alta", status: "Pendente" },
  { id: 2, titulo: "Revisão de contrato fornecedor", responsavel: "Jurídico", prazo: "30/08/2026", prioridade: "Média", status: "Em Andamento" },
  { id: 3, titulo: "Atualização de licenças software", responsavel: "TI", prazo: "05/09/2026", prioridade: "Baixa", status: "Pendente" },
];

const mockAlertas = [
  { id: 101, tipo: "Estoque Crítico", msg: "Peça SKU-899 abaixo do limite mínimo (2 un)", urgencia: "Vermelho" },
  { id: 102, tipo: "Documento Rejeitado", msg: "NFe 44591 rejeitada pela SEFAZ", urgencia: "Laranja" },
  { id: 103, tipo: "Pagamento Próximo", msg: "Fatura de Energia vence amanhã", urgencia: "Amarelo" },
];

export function NotificacoesViewer() {
  const [abaAtiva, setAbaAtiva] = useState('tarefas');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px]">
      
      {/* Header do Módulo */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-6 h-6 text-indigo-600" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
              {mockTarefas.length + mockAlertas.length}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Central de Pendências</h2>
            <p className="text-sm text-slate-500">Gerencie suas tarefas e alertas do sistema</p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2">
        <button 
          onClick={() => setAbaAtiva('tarefas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${abaAtiva === 'tarefas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <CheckCircle className="w-4 h-4" />
          Minhas Tarefas ({mockTarefas.length})
        </button>
        <button 
          onClick={() => setAbaAtiva('alertas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${abaAtiva === 'alertas' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <AlertTriangle className="w-4 h-4" />
          Alertas do Sistema ({mockAlertas.length})
        </button>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="flex-1 p-4 bg-slate-50/50 overflow-y-auto">
        
        {abaAtiva === 'tarefas' && (
          <div className="space-y-3">
            {mockTarefas.map(tarefa => (
              <div key={tarefa.id} className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex justify-between items-start hover:border-indigo-200 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{tarefa.titulo}</h4>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {tarefa.responsavel}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Prazo: {tarefa.prazo}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm ${tarefa.prioridade === 'Alta' ? 'bg-red-100 text-red-700' : tarefa.prioridade === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    Prioridade {tarefa.prioridade}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3"/> {tarefa.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'alertas' && (
          <div className="space-y-3">
            {mockAlertas.map(alerta => (
              <div key={alerta.id} className={`p-4 rounded-md border flex items-start gap-3 shadow-sm ${alerta.urgencia === 'Vermelho' ? 'bg-red-50 border-red-200' : alerta.urgencia === 'Laranja' ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200'}`}>
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${alerta.urgencia === 'Vermelho' ? 'text-red-600' : alerta.urgencia === 'Laranja' ? 'text-orange-500' : 'text-amber-500'}`} />
                <div>
                  <h4 className={`text-sm font-bold ${alerta.urgencia === 'Vermelho' ? 'text-red-900' : 'text-slate-800'}`}>{alerta.tipo}</h4>
                  <p className="text-sm text-slate-600 mt-1">{alerta.msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}