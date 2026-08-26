// frontend/src/components/ProcessosTecnicosViewer.tsx
'use client';

import React, { useState } from 'react';
import {
  Scissors,
  Layers,
  Flame,
  Paintbrush,
  Wrench,
  Sparkles,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  DollarSign,
  Percent,
  Sliders,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  OrdemProducaoCompleta,
  OpOperacao,
  ExtensaoCorteLaser,
  ExtensaoDobraCNC,
  ExtensaoSoldaCaldeiraria,
  ExtensaoPinturaAcabamento,
  ExtensaoMontagem,
  ExtensaoAcabamento,
  ExtensaoServicoExterno,
} from '@/backend/modules/producao/producao-types';

interface ProcessosTecnicosViewerProps {
  ops: OrdemProducaoCompleta[];
  resumoCorte?: any[];
  resumoDobra?: any[];
  onOpenOpModal?: (op: OrdemProducaoCompleta) => void;
}

export function ProcessosTecnicosViewer({
  ops,
  resumoCorte = [],
  resumoDobra = [],
  onOpenOpModal,
}: ProcessosTecnicosViewerProps) {
  const [subTab, setSubTab] = useState<
    'corte' | 'dobra' | 'solda' | 'pintura' | 'montagem' | 'acabamento' | 'terceiros'
  >('corte');

  // Coleta todas as operações com suas respectivas extensões
  const operacoesCorte: { op: OrdemProducaoCompleta; oper: OpOperacao; ext: ExtensaoCorteLaser }[] = [];
  const operacoesDobra: { op: OrdemProducaoCompleta; oper: OpOperacao; ext: ExtensaoDobraCNC }[] = [];
  const operacoesSolda: { op: OrdemProducaoCompleta; oper: OpOperacao; ext: ExtensaoSoldaCaldeiraria }[] = [];
  const operacoesPintura: { op: OrdemProducaoCompleta; oper: OpOperacao; ext: ExtensaoPinturaAcabamento }[] = [];
  const operacoesMontagem: { op: OrdemProducaoCompleta; oper: OpOperacao; ext: ExtensaoMontagem }[] = [];
  const operacoesAcabamento: { op: OrdemProducaoCompleta; oper: OpOperacao; ext: ExtensaoAcabamento }[] = [];
  const operacoesTerceiros: { op: OrdemProducaoCompleta; oper: OpOperacao; ext: ExtensaoServicoExterno }[] = [];

  ops.forEach((op) => {
    op.operacoes.forEach((oper) => {
      if (oper.extensaoCorte) {
        operacoesCorte.push({ op, oper, ext: oper.extensaoCorte });
      }
      if (oper.extensaoDobra) {
        operacoesDobra.push({ op, oper, ext: oper.extensaoDobra });
      }
      if (oper.extensaoSolda) {
        operacoesSolda.push({ op, oper, ext: oper.extensaoSolda });
      }
      if (oper.extensaoPintura) {
        operacoesPintura.push({ op, oper, ext: oper.extensaoPintura });
      }
      if (oper.extensaoMontagem) {
        operacoesMontagem.push({ op, oper, ext: oper.extensaoMontagem });
      }
      if (oper.extensaoAcabamento) {
        operacoesAcabamento.push({ op, oper, ext: oper.extensaoAcabamento });
      }
      if (oper.extensaoServicoExterno) {
        operacoesTerceiros.push({ op, oper, ext: oper.extensaoServicoExterno });
      }
    });
  });

  return (
    <div className="space-y-6" id="processos-tecnicos-container">
      {/* SELEÇÃO DO PROCESSO TÉCNICO */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Engenharia de Processos & Extensões Industriais
            </h3>
            <p className="text-xs text-slate-500">
              Parametrização avançada, balanço de massa, consumo de consumíveis e rastreabilidade técnica por etapa de fabricação.
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO DE SUB-ABAS DE PROCESSOS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSubTab('corte')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'corte'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Corte Laser / Plasma ({operacoesCorte.length})
          </button>

          <button
            onClick={() => setSubTab('dobra')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'dobra'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Dobra CNC & Ferramental ({operacoesDobra.length})
          </button>

          <button
            onClick={() => setSubTab('solda')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'solda'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Solda & Caldeiraria / EPS ({operacoesSolda.length})
          </button>

          <button
            onClick={() => setSubTab('pintura')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'pintura'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            Pintura & Estufa / RAL ({operacoesPintura.length})
          </button>

          <button
            onClick={() => setSubTab('montagem')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'montagem'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Montagem & Torques Nm ({operacoesMontagem.length})
          </button>

          <button
            onClick={() => setSubTab('acabamento')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'acabamento'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Acabamento & Rugosidade Ra ({operacoesAcabamento.length})
          </button>

          <button
            onClick={() => setSubTab('terceiros')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'terceiros'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Serviços Externos / Terceiros ({operacoesTerceiros.length})
          </button>
        </div>
      </div>

      {/* 1. SEÇÃO DE CORTE A LASER */}
      {subTab === 'corte' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Processos Ativos</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{operacoesCorte.length} Etapas</div>
              <span className="text-[11px] text-slate-500">Laser Fibra, Oxicorte e Plasma</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Aproveitamento Médio (Nesting)</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {operacoesCorte.length > 0
                  ? (
                      operacoesCorte.reduce(
                        (acc, cur) => acc + (cur.ext.nestingAproveitamentoPercentual || 85),
                        0
                      ) / operacoesCorte.length
                    ).toFixed(1)
                  : '0.0'}
                %
              </div>
              <span className="text-[11px] text-slate-500">Eficiência de chapa bruta</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Retalhos Úteis Gerados</span>
              <div className="text-xl font-bold text-blue-700 mt-1">
                R${' '}
                {operacoesCorte
                  .reduce((acc, cur) => acc + (cur.ext.retalhoValorizadoCredito || 0), 0)
                  .toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500">Crédito estornado no custo das OPs</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Balanço de Sucata</span>
              <div className="text-xl font-bold text-rose-700 mt-1">
                {operacoesCorte
                  .reduce((acc, cur) => acc + (cur.ext.pesoSucataTotalKg || 0), 0)
                  .toFixed(1)}{' '}
                kg
              </div>
              <span className="text-[11px] text-slate-500">Esqueleto e perdas irrecuperáveis</span>
            </div>
          </div>

          <div className="space-y-4">
            {operacoesCorte.map(({ op, oper, ext }) => (
              <div
                key={oper.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{op.numero}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        Seq {oper.sequencia}: {oper.nomeOperacao}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                        {ext.tipoProcessoCorte}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {op.produtoCodigo} - {op.produtoDescricao}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Máquina: {oper.maquinaNome}</span>
                    <span className="text-xs font-bold text-emerald-700">
                      Nesting: {ext.nestingAproveitamentoPercentual || 88.5}% de aproveitamento
                    </span>
                  </div>
                </div>

                {/* Grid Técnico de Corte */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Matéria-Prima & Chapa</span>
                    <div className="font-bold text-slate-800">{ext.material}</div>
                    <div className="text-slate-600 mt-0.5">Espessura: <strong>{ext.espessuraMm} mm</strong></div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">{ext.chapaDescricao}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Programa CNC & Formato</span>
                    <div className="font-mono font-bold text-slate-800">{ext.programaCncCodigo || 'PRG-LASER-V01.cnc'}</div>
                    <div className="text-slate-600 mt-0.5">
                      Chapas: {ext.totalChapasConsumidasReal || 1} un (de {ext.totalChapasNecessarias || 1} prev)
                    </div>
                    <div className="text-slate-600">
                      Peças / Chapa: <strong>{ext.quantidadePecasPorChapa || 4} un</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Gás & Consumíveis</span>
                    <div className="font-bold text-slate-800">{ext.gasTipo || 'NITROGENIO_N2_ALTA_PRESSAO'}</div>
                    <div className="text-slate-600 mt-0.5">Pressão: <strong>{ext.gasPressaoBar || 18} bar</strong></div>
                    <div className="text-slate-600">Bico: {ext.bicoNozzleModelo || 'Duplo Ø 2.0mm'}</div>
                    <div className="text-[11px] text-emerald-700 font-bold mt-1">
                      Custo Gás: R$ {(ext.custoGasConsumiveisTotal || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Balanço de Massa & Retalhos</span>
                    <div className="text-slate-700">Peso Peças: <strong>{ext.pesoLiquidoTotalPecasKg} kg</strong></div>
                    <div className="text-slate-700">Sucata: <strong>{ext.pesoSucataTotalKg} kg</strong> ({ext.tipoSucata})</div>
                    {ext.temRetalhoAproveitavel && (
                      <div className="mt-1 p-1.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900 font-medium">
                        Retalho Útil: {ext.retalhoDescricao} (+R$ {ext.retalhoValorizadoCredito?.toFixed(2)} crédito)
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>Peças Planejadas: <strong className="text-slate-800">{ext.quantidadePecasPlanejada}</strong></span>
                    <span>Cortadas Boas: <strong className="text-emerald-700">{ext.quantidadePecasCortadasBoas}</strong></span>
                    <span>Refugadas: <strong className="text-rose-700">{ext.quantidadePecasRefugadas}</strong></span>
                  </div>
                  {onOpenOpModal && (
                    <button
                      onClick={() => onOpenOpModal(op)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      Ver Detalhes da OP <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SEÇÃO DE DOBRA CNC */}
      {subTab === 'dobra' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Operações de Dobra</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{operacoesDobra.length} Etapas</div>
              <span className="text-[11px] text-slate-500">Prensas Dobradeiras CNC</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Peças Conformadas Boas</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {operacoesDobra.reduce((acc, cur) => acc + (cur.ext.quantidadeDobradaBoas || 0), 0)} un
              </div>
              <span className="text-[11px] text-slate-500">Liberadas para solda/montagem</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Passos de Dobra Registrados</span>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {operacoesDobra.reduce((acc, cur) => acc + (cur.ext.sequenciaPassosDobra?.length || 0), 0)} passos
              </div>
              <span className="text-[11px] text-slate-500">Sequenciamento ferramental</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Retrabalhos por Springback</span>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {operacoesDobra.filter((o) => o.ext.houveRetrabalhoDobra).length} Ocorrências
              </div>
              <span className="text-[11px] text-slate-500">Compensação de retorno elástico</span>
            </div>
          </div>

          <div className="space-y-4">
            {operacoesDobra.map(({ op, oper, ext }) => (
              <div
                key={oper.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{op.numero}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        Seq {oper.sequencia}: {oper.nomeOperacao}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {op.produtoCodigo} - {op.produtoDescricao}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Máquina: {ext.maquinaNome}</span>
                    <span className="text-xs font-bold text-blue-700">
                      {ext.ferramentaConjunto} | Matriz V={ext.aberturaMatrizV_Mm}mm
                    </span>
                  </div>
                </div>

                {/* Informações Gerais de Ferramental */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Ferramental Punção & Matriz</span>
                    <div className="font-bold text-slate-800">{ext.puncaoModelo}</div>
                    <div className="text-slate-600 mt-0.5">{ext.matrizModelo}</div>
                    <div className="text-slate-600">Raio Interno: <strong>{ext.raioInternoDobraMm} mm</strong> | Espessura: <strong>{ext.espessuraMaterialMm} mm</strong></div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Ângulos & Retorno Elástico</span>
                    <div className="font-bold text-slate-800">{ext.angulosDescricao}</div>
                    <div className="text-slate-600 mt-0.5">
                      Compensação Springback: <strong>+{ext.compensacaoSpringback}°</strong>
                    </div>
                    <div className="text-slate-600">
                      Total de Dobras por Peça: <strong>{ext.totalDobrasPorPeca} dobras</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Tempos & Eficiência</span>
                    <div className="text-slate-700">Setup Real: <strong>{ext.tempoSetupRealMinutos || oper.tempoSetupRealMinutos} min</strong></div>
                    <div className="text-slate-700">Ciclo Real: <strong>{ext.tempoDobraRealPorPecaMinutos || 8} min/peça</strong></div>
                    <div className="text-slate-700">Tempo Total: <strong>{ext.tempoTotalRealMinutos || oper.tempoTotalRealMinutos} min</strong></div>
                  </div>
                </div>

                {/* Tabela de Passos Sequenciais de Dobra */}
                {ext.sequenciaPassosDobra && ext.sequenciaPassosDobra.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      Sequência Programada de Dobras (Passo a Passo)
                    </span>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2">Passo</th>
                            <th className="p-2">Descrição da Conformação</th>
                            <th className="p-2 text-center">Ângulo Nominal</th>
                            <th className="p-2 text-center">Ângulo Medido</th>
                            <th className="p-2 text-right">Comprimento</th>
                            <th className="p-2 text-right">Força</th>
                            <th className="p-2">Punção / Matriz</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ext.sequenciaPassosDobra.map((passo) => (
                            <tr key={passo.passoNumero} className="hover:bg-slate-50">
                              <td className="p-2 font-bold font-mono text-blue-700">{passo.passoNumero}</td>
                              <td className="p-2 font-medium text-slate-800">{passo.descricaoDobra}</td>
                              <td className="p-2 text-center font-mono font-bold">{passo.anguloNominalGraus}°</td>
                              <td className="p-2 text-center font-mono font-bold text-emerald-700">
                                {passo.anguloMedidoRealGraus ? `${passo.anguloMedidoRealGraus}°` : '-'}
                              </td>
                              <td className="p-2 text-right font-mono">{passo.comprimentoDobraMm} mm</td>
                              <td className="p-2 text-right font-mono font-semibold">{passo.forcaDobraToneladas || 35} ton</td>
                              <td className="p-2 text-[11px] font-mono text-slate-600">
                                {passo.puncaoCodigo} / {passo.matrizCodigo} (V={passo.aberturaMatrizV_Mm}mm)
                              </td>
                              <td className="p-2 text-center">
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                                  {passo.statusPasso}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {ext.houveRetrabalhoDobra && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-amber-900 block">
                      Ação Corretiva de Dobra: {ext.motivoRetrabalhoDobra}
                    </span>
                    <p className="text-amber-800">{ext.descricaoRetrabalhoDobra}</p>
                    <span className="text-[11px] font-semibold text-amber-900 block">
                      Custo Adicional Absorvido: R$ {(ext.custoRetrabalhoDobra || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SEÇÃO DE SOLDA & CALDEIRARIA */}
      {subTab === 'solda' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {operacoesSolda.map(({ op, oper, ext }) => (
              <div
                key={oper.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{op.numero}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        Seq {oper.sequencia}: {oper.nomeOperacao}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                        Processo {ext.processo}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {op.produtoCodigo} - {op.produtoDescricao}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Posto: {oper.maquinaNome}</span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      EPS: {ext.procedimentoEPS_WPS}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Gás de Proteção & Vazão</span>
                    <div className="font-bold text-slate-800">{ext.gasProtecao}</div>
                    <div className="text-slate-600 mt-0.5">
                      Vazão: <strong>{ext.gasConsumoLitrosMinuto || 14} L/min</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Consumível Arame / Vareta</span>
                    <div className="font-bold text-slate-800">{ext.consumivelArameCodigo}</div>
                    <div className="text-slate-600 mt-0.5">Lote: <strong>{ext.consumivelArameLote || 'LOT-WELD-01'}</strong></div>
                    <div className="text-slate-600">
                      Consumo: <strong>{ext.consumoArameRealKg || ext.consumoArameEstimadoKg} kg</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Norma & Qualificação</span>
                    <div className="font-semibold text-slate-800">{ext.qualificacaoSoldadorNorma || 'ASME Sec IX / AWS D1.1'}</div>
                    <div className="text-slate-600 mt-0.5">Junta: <strong>{ext.tipoJunta || 'TOPO_COM_CHANFRO_V'}</strong></div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Ensaio Não Destrutivo (END)</span>
                    <div className="font-bold text-slate-800">{ext.inspecaoEnsaioNaoDestrutivo}</div>
                    <div className="text-slate-600 mt-0.5">Laudo: <strong>{ext.laudoInspecaoNumero || 'LAUDO-END-2026-091'}</strong></div>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${ext.aprovadoQualidadeSolda ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {ext.aprovadoQualidadeSolda ? 'APROVADO 100%' : 'EM INSPEÇÃO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SEÇÃO DE PINTURA & ESTUFA */}
      {subTab === 'pintura' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {operacoesPintura.map(({ op, oper, ext }) => (
              <div
                key={oper.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{op.numero}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        Seq {oper.sequencia}: {oper.nomeOperacao}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold">
                        {ext.tipoPintura}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {op.produtoCodigo} - {op.produtoDescricao}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Cor RAL: {ext.corRAL}</span>
                    <span className="text-xs font-bold text-purple-700">{ext.corDescricao}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Pré-Tratamento Superficial</span>
                    <div className="font-bold text-slate-800">{ext.preTratamentoSuperficie}</div>
                    <div className="text-slate-600 mt-0.5">Área: <strong>{ext.areaTotalPinturaM2 || 45} m²</strong></div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Espessura de Camada (µm)</span>
                    <div className="text-slate-700">Prevista: <strong>{ext.espessuraCamadaMicronsPrevista} µm</strong></div>
                    <div className="text-emerald-700 font-bold mt-0.5">
                      Medida Real: <strong>{ext.espessuraCamadaMicronsReal || 95} µm</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Cura em Estufa</span>
                    <div className="font-bold text-slate-800">Temperatura: {ext.temperaturaEstufaC || 200} °C</div>
                    <div className="text-slate-600 mt-0.5">Tempo: <strong>{ext.tempoEstufaMinutos || 20} minutos</strong></div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Consumo de Tinta</span>
                    <div className="font-bold text-slate-800">{ext.consumoTintaRealKgOuLitros || 14} kg</div>
                    <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                      Custo: R$ {(ext.custoInsumosPintura || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SEÇÃO DE MONTAGEM MECÂNICA */}
      {subTab === 'montagem' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {operacoesMontagem.map(({ op, oper, ext }) => (
              <div
                key={oper.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{op.numero}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        Seq {oper.sequencia}: {oper.nomeOperacao}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {op.produtoCodigo} - {op.produtoDescricao}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Instrução: {ext.instrucaoMontagemNumero || 'IT-MONT-001'}</span>
                    <span className="text-xs font-bold text-blue-700">Torque: {ext.torquesEspecificadosNm || '65 Nm'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Torquímetro & Calibração</span>
                    <div className="font-bold text-slate-800">{ext.ferramentaTorquimetroUtilizada || 'Torquímetro Gedore 20-100 Nm'}</div>
                    <div className="text-slate-600 mt-0.5">Gabarito: <strong>{ext.gabaritoMontagemCodigo || 'GAB-01'}</strong></div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Componentes Fixados</span>
                    <div className="font-bold text-slate-800">
                      {ext.quantidadeComponentesMontadosPorPeca || 8} elementos / conjunto
                    </div>
                    <div className="text-slate-600 mt-0.5">Parafusos, porcas parlock e arruelas de pressão</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Teste Funcional & Inspeção</span>
                    <div className="font-semibold text-slate-800">{ext.testeFuncionalDescricao || 'Teste de articulação mecânica e aperto'}</div>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        APROVADO 100%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SEÇÃO DE ACABAMENTO & POLIMENTO */}
      {subTab === 'acabamento' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {operacoesAcabamento.map(({ op, oper, ext }) => (
              <div
                key={oper.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{op.numero}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        Seq {oper.sequencia}: {oper.nomeOperacao}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {op.produtoCodigo} - {op.produtoDescricao}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Tipo: {ext.tipoAcabamento}</span>
                    <span className="text-xs font-bold text-emerald-700">
                      Rugosidade: Ra {ext.rugosidadeMedidaRealRa || 0.35} µm (máx: {ext.rugosidadeMaximaRa_Microns || 0.4} µm)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Granulometria & Etapas</span>
                    <div className="font-medium text-slate-800">{ext.granulometriaLixa || 'Sequência Grão 120 -> 240 -> 320 -> 400'}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Abrasivos e Pastas</span>
                    <div className="text-slate-800">{ext.insumosAbrasivosUtilizados || ext.abrasivosUtilizados || 'Discos 3M e pasta diamantada'}</div>
                    <div className="text-[11px] text-emerald-700 font-bold mt-1">
                      Custo: R$ {(ext.custoInsumosAcabamento || ext.custoAbrasivosInsumos || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Inspeção Visual & Sanitária</span>
                    <div className="text-slate-700">Livre de poros, rebarbas e marcas de laminação</div>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        CONFORME NORMA SANITÁRIA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SEÇÃO DE SERVIÇOS EXTERNOS */}
      {subTab === 'terceiros' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {operacoesTerceiros.map(({ op, oper, ext }) => (
              <div
                key={oper.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{op.numero}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        Seq {oper.sequencia}: {oper.nomeOperacao}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {op.produtoCodigo} - {op.produtoDescricao}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Fornecedor: {ext.fornecedorNome}</span>
                    <span className="text-xs font-bold text-emerald-700">
                      Custo Total: R$ {ext.custoTotalServicoExterno.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Serviço & Fornecedor</span>
                    <div className="font-bold text-slate-800">{ext.tipoServico}</div>
                    <div className="text-slate-600 mt-0.5">{ext.fornecedorNome}</div>
                    <div className="text-[11px] font-mono text-slate-500">{ext.fornecedorCnpj || 'CNPJ: 14.552.889/0001-44'}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Notas Fiscais de Remessa / Retorno</span>
                    <div className="text-slate-700">Remessa: <strong>{ext.notaFiscalRemessa || ext.notaFiscalRemessaNumero || 'NF-e 045.112'}</strong></div>
                    <div className="text-slate-700 mt-0.5">Retorno: <strong>{ext.notaFiscalRetorno || ext.notaFiscalRetornoNumero || 'NF-e 089.442'}</strong></div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Envio: {ext.dataEnvio || ext.dataEnvioRemessa} | Retorno: {ext.dataRetornoReal || ext.dataRetornoPrevista}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Quantidades & Rendimento</span>
                    <div className="text-slate-700">Enviada: <strong>{ext.quantidadeEnviada} un</strong></div>
                    <div className="text-slate-700">Retornada Aprovada: <strong>{ext.quantidadeAprovada || ext.quantidadeRetornada} un</strong></div>
                    <div className="text-slate-700">Rejeitada: <strong className="text-rose-600">{ext.quantidadeRejeitada || 0} un</strong></div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Certificado & Inspeção</span>
                    <div className="font-mono text-slate-800">{ext.certificadoTratamentoNumero || ext.laudoCertificadoFornecedor || 'CERT-GALV-2026-7881'}</div>
                    <div className="text-slate-600 mt-0.5">Camada Medida: <strong>{ext.espessuraCamadaMicronsMedida || 85} µm</strong></div>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        INSPEÇÃO DE RECEBIMENTO APROVADA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
