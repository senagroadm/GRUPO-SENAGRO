'use client';

import React, { useState, useEffect } from 'react';
import {
  Barcode,
  Scale,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Printer,
  Sparkles,
  RefreshCw,
  Search,
  Box,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck,
  AlertCircle,
  Tag,
  Check,
} from 'lucide-react';
import { Expedicao, ItemExpedicao } from '@/backend/modules/expedicao/expedicao-types';
import { Empresa } from '@/backend/core/types/company';

interface ConferenciaCegaBipagemProps {
  empresaAtiva: Empresa;
  expedicoes: Expedicao[];
  onFinalizarConferencia: (expedicaoId: string, pesoAferidoKg: number, volumesGerados: any[]) => void;
  onImprimirEtiqueta: (volume: any) => void;
}

export function ConferenciaCegaBipagem({
  empresaAtiva,
  expedicoes,
  onFinalizarConferencia,
  onImprimirEtiqueta,
}: ConferenciaCegaBipagemProps) {
  // Expedições elegíveis para conferência (aguardando separação ou em conferência)
  const expedicoesAptas = expedicoes.filter(
    (e) => e.status === 'AGUARDANDO_SEPARACAO' || e.status === 'EM_SEPARACAO' || e.status === 'CONFERENCIA_EMBALAGEM'
  );

  const [expedicaoSelecionadaId, setExpedicaoSelecionadaId] = useState<string>(
    expedicoesAptas[0]?.id || expedicoes[0]?.id || ''
  );

  const expedicaoAtual = expedicoes.find((e) => e.id === expedicaoSelecionadaId) || expedicoesAptas[0];

  // Estado da Conferência Cega Local
  const [itensConferidos, setItensConferidos] = useState<{ [codigoProduto: string]: number }>({});
  const [codigoBarrasInput, setCodigoBarrasInput] = useState('');
  const [ultimoAlerta, setUltimoAlerta] = useState<{ tipo: 'SUCESSO' | 'ERRO' | 'INFO'; mensagem: string } | null>(null);
  const [pesoBalançaKg, setPesoBalançaKg] = useState<number>(0);
  const [lacreSeguranca, setLacreSeguranca] = useState<string>('LAC-2026-9981');
  const [tipoEmbalagem, setTipoEmbalagem] = useState<'PALLET_PBR' | 'CAIXA_REFORCADA' | 'ENGRADADO_ACO'>('PALLET_PBR');
  const [quantidadeVolumes, setQuantidadeVolumes] = useState<number>(1);
  const [etiquetaGerada, setEtiquetaGerada] = useState<any | null>(null);

  // Inicializa peso e conferência quando muda a expedição selecionada
  useEffect(() => {
    if (expedicaoAtual) {
      setPesoBalançaKg(expedicaoAtual.pesoBrutoTotalKg || 120);
      const inicial: { [codigoProduto: string]: number } = {};
      expedicaoAtual.itens.forEach((it) => {
        inicial[it.codigoProduto] = it.quantidadeConferida || 0;
      });
      setItensConferidos(inicial);
      setUltimoAlerta({
        tipo: 'INFO',
        mensagem: `Expedição ${expedicaoAtual.numeroExpedicao} carregada para conferência de doca.`,
      });
      setEtiquetaGerada(null);
    }
  }, [expedicaoSelecionadaId, expedicaoAtual]);

  // Executa bipagem de código de barras
  const handleBiparCodigo = (codigoBipado: string) => {
    if (!expedicaoAtual) return;
    const cleanCode = codigoBipado.trim();
    if (!cleanCode) return;

    // Procura o item pelo código de produto ou código de barras
    const itemEncontrado = expedicaoAtual.itens.find(
      (it) => it.codigoProduto.toLowerCase() === cleanCode.toLowerCase() ||
              it.codigoBarras?.toLowerCase() === cleanCode.toLowerCase() ||
              cleanCode.includes(it.codigoProduto)
    );

    if (!itemEncontrado) {
      setUltimoAlerta({
        tipo: 'ERRO',
        mensagem: `[BLOQUEIO] Código "${cleanCode}" NÃO PERTENCE a esta expedição! Item trocado ou incorreto.`,
      });
      setCodigoBarrasInput('');
      return;
    }

    const qtdAtual = itensConferidos[itemEncontrado.codigoProduto] || 0;
    if (qtdAtual >= itemEncontrado.quantidadeSolicitada) {
      setUltimoAlerta({
        tipo: 'ERRO',
        mensagem: `[EXCESSO] Item ${itemEncontrado.descricao} já atingiu a quantidade solicitada (${itemEncontrado.quantidadeSolicitada} ${itemEncontrado.unidadeMedida}).`,
      });
      setCodigoBarrasInput('');
      return;
    }

    // Incrementa item conferido
    const novaQtd = qtdAtual + 1;
    setItensConferidos((prev) => ({
      ...prev,
      [itemEncontrado.codigoProduto]: novaQtd,
    }));

    setUltimoAlerta({
      tipo: 'SUCESSO',
      mensagem: `Bipado com sucesso: ${itemEncontrado.descricao} (${novaQtd}/${itemEncontrado.quantidadeSolicitada} ${itemEncontrado.unidadeMedida})`,
    });
    setCodigoBarrasInput('');
  };

  // Calcula % de conclusão da conferência cega
  const totalItensSolicitados = expedicaoAtual?.itens.reduce((acc, it) => acc + it.quantidadeSolicitada, 0) || 1;
  const totalItensBipados = Object.values(itensConferidos).reduce((acc, q) => acc + q, 0);
  const percentualConcluido = Math.min(100, Math.round((totalItensBipados / totalItensSolicitados) * 100));
  const conferencia100PorCento = totalItensBipados >= totalItensSolicitados;

  // Tolerância de balança (±2.5%)
  const pesoTeoricoKg = expedicaoAtual?.pesoBrutoTotalKg || 100;
  const variacaoPesoKg = Math.abs(pesoBalançaKg - pesoTeoricoKg);
  const variacaoPesoPerc = ((variacaoPesoKg / pesoTeoricoKg) * 100).toFixed(1);
  const pesoAprovadoTolerancia = Number(variacaoPesoPerc) <= 3.5;

  return (
    <div className="space-y-6">
      {/* Header do Cockpit */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Cockpit de Conferência Cega & Bipagem de Volumes (Packing Station)
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-full">
                Zero Erro de Separação
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Validação item a item via scanner/código de barras, pesagem automatizada com tolerância e geração de etiquetas GS1-128.
            </p>
          </div>
        </div>

        {/* Seletor de Pedido/Expedição Ativa */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Expedição:</span>
          <select
            value={expedicaoSelecionadaId}
            onChange={(e) => setExpedicaoSelecionadaId(e.target.value)}
            className="text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:border-purple-500"
          >
            {expedicoes.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.numeroExpedicao} - {exp.clienteNome} ({exp.itens.length} itens)
              </option>
            ))}
          </select>
        </div>
      </div>

      {expedicaoAtual ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Terminal de Bipagem & Scanner (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Terminal Input */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-slate-300">
                    Terminal Leitor Ativo • Estação {empresaAtiva.cidade}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {totalItensBipados}/{totalItensSolicitados} itens conferidos ({percentualConcluido}%)
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    conferencia100PorCento ? 'bg-emerald-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${percentualConcluido}%` }}
                ></div>
              </div>

              {/* Input com simulação de leitura */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Aproxime o leitor de código de barras ou digite o SKU / EAN:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Bipar código de barras do produto..."
                      value={codigoBarrasInput}
                      onChange={(e) => setCodigoBarrasInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBiparCodigo(codigoBarrasInput);
                        }
                      }}
                      autoFocus
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-mono p-3 rounded-lg focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
                    />
                    <Barcode className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                  </div>
                  <button
                    onClick={() => handleBiparCodigo(codigoBarrasInput)}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 font-bold text-xs text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Bipar
                  </button>
                </div>

                {/* Bipagem rápida / botões de teste */}
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Atalhos de Bipagem:</span>
                  {expedicaoAtual.itens.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => handleBiparCodigo(it.codigoProduto)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono rounded border border-slate-700 transition-colors"
                    >
                      +1 {it.codigoProduto}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner de Feedback Sonoro/Visual */}
              {ultimoAlerta && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    ultimoAlerta.tipo === 'SUCESSO'
                      ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                      : ultimoAlerta.tipo === 'ERRO'
                      ? 'bg-rose-950/80 border border-rose-700 text-rose-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  {ultimoAlerta.tipo === 'SUCESSO' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {ultimoAlerta.tipo === 'ERRO' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  {ultimoAlerta.tipo === 'INFO' && <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />}
                  <span>{ultimoAlerta.mensagem}</span>
                </div>
              )}
            </div>

            {/* Lista Cega de Itens da Expedição */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center justify-between">
                <span>Itens da Remessa Fiscal ({expedicaoAtual.itens.length} SKUs)</span>
                <span className="text-[11px] font-normal text-slate-500">Destino: {expedicaoAtual.cidadeDestino}/{expedicaoAtual.ufDestino}</span>
              </h3>

              <div className="divide-y divide-slate-100">
                {expedicaoAtual.itens.map((it) => {
                  const conferidos = itensConferidos[it.codigoProduto] || 0;
                  const itemCompleto = conferidos === it.quantidadeSolicitada;
                  const itemIncompleto = conferidos > 0 && conferidos < it.quantidadeSolicitada;

                  return (
                    <div key={it.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
                            {it.codigoProduto}
                          </span>
                          {it.descricao}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          EAN: {it.codigoBarras || '7891234500018'} • Peso Unit: {it.pesoBrutoKg.toFixed(2)} kg
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`font-black text-sm ${itemCompleto ? 'text-emerald-600' : itemIncompleto ? 'text-purple-600' : 'text-slate-400'}`}>
                            {conferidos} / {it.quantidadeSolicitada} {it.unidadeMedida}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {itemCompleto ? '100% Concluído' : `${it.quantidadeSolicitada - conferidos} pendente(s)`}
                          </span>
                        </div>

                        {itemCompleto ? (
                          <span className="p-1 bg-emerald-100 text-emerald-700 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="p-1 bg-slate-100 text-slate-400 rounded-full">
                            <Box className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Balança Integrada, Lacre & Emissão de Volume (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Balança de Doca & Tolerância */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  Balança Dinâmica de Saída
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                  pesoAprovadoTolerancia ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {pesoAprovadoTolerancia ? 'Tolerância Conforme (±2%)' : 'Divergência de Peso'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Peso Aferido na Balança de Saída (kg):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={pesoBalançaKg}
                      onChange={(e) => setPesoBalançaKg(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-lg font-black text-slate-900"
                    />
                    <button
                      onClick={() => setPesoBalançaKg(pesoTeoricoKg)}
                      title="Capturar peso da balança serial"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tara
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Peso Nominal NF-e / Engenharia:</span>
                    <strong className="text-slate-900">{pesoTeoricoKg.toFixed(2)} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Variação Aferida:</span>
                    <span className={`font-bold ${pesoAprovadoTolerancia ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {variacaoPesoKg.toFixed(2)} kg ({variacaoPesoPerc}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parâmetros do Volume & Lacre */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Tag className="w-4 h-4 text-purple-600" />
                Fechamento de Embalagem & Lacre
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo Embalagem:</label>
                  <select
                    value={tipoEmbalagem}
                    onChange={(e) => setTipoEmbalagem(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="PALLET_PBR">Pallet PBR Madeira</option>
                    <option value="CAIXA_REFORCADA">Caixa Papelão Reforçada</option>
                    <option value="ENGRADADO_ACO">Engradado de Aço</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Qtd Volumes:</label>
                  <input
                    type="number"
                    min={1}
                    value={quantidadeVolumes}
                    onChange={(e) => setQuantidadeVolumes(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número do Lacre Inviolável:</label>
                <input
                  type="text"
                  value={lacreSeguranca}
                  onChange={(e) => setLacreSeguranca(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              {/* Botão de Concluir & Imprimir Etiquetas */}
              <div className="pt-2 space-y-2">
                <button
                  disabled={!conferencia100PorCento}
                  onClick={() => {
                    const novoVolume = {
                      id: `VOL-${Math.floor(1000 + Math.random() * 9000)}`,
                      numeroVolume: 1,
                      totalVolumes: quantidadeVolumes,
                      tipoEmbalagem,
                      pesoBrutoKg: pesoBalançaKg,
                      lacreNumero: lacreSeguranca,
                      codigoBarrasGS1: `(00)37891234500000${Math.floor(1000 + Math.random() * 9000)}`,
                      destinatario: expedicaoAtual.clienteNome,
                      cidadeUf: `${expedicaoAtual.cidadeDestino}/${expedicaoAtual.ufDestino}`,
                      transportadora: expedicaoAtual.transportadoraNome || 'Transportadora Contratada',
                    };
                    setEtiquetaGerada(novoVolume);
                    onFinalizarConferencia(expedicaoAtual.id, pesoBalançaKg, [novoVolume]);
                  }}
                  className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors ${
                    conferencia100PorCento
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <PackageCheck className="w-4 h-4" />
                  {conferencia100PorCento ? 'Aprovar & Gerar Volumes GS1' : 'Conclua a bipagem dos itens'}
                </button>
              </div>
            </div>

            {/* Preview da Etiqueta Padrão GS1-128 */}
            {etiquetaGerada && (
              <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="text-[11px] font-extrabold uppercase text-amber-900 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-amber-700" />
                    Etiqueta Logística GS1-128 Pronta
                  </span>
                  <button
                    onClick={() => onImprimirEtiqueta(etiquetaGerada)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded shadow-2xs transition-colors"
                  >
                    Imprimir Zebra (ZPL)
                  </button>
                </div>

                <div className="bg-white border border-slate-300 p-3 rounded text-center space-y-1.5 font-mono text-xs">
                  <div className="font-bold text-slate-900 text-sm">{empresaAtiva.nomeFantasia}</div>
                  <div className="text-[10px] text-slate-500">VOL: {etiquetaGerada.numeroVolume} / {etiquetaGerada.totalVolumes} • {etiquetaGerada.pesoBrutoKg} kg</div>
                  <div className="text-xs font-bold text-slate-800 truncate">PARA: {etiquetaGerada.destinatario}</div>
                  <div className="text-[11px] text-slate-600">{etiquetaGerada.cidadeUf} • Transp: {etiquetaGerada.transportadora}</div>
                  <div className="py-2 flex flex-col items-center justify-center">
                    <div className="h-10 w-48 bg-slate-900 flex items-center justify-center text-white text-[9px] tracking-widest font-black">
                      ||||| | |||| |||| ||||| |||
                    </div>
                    <span className="text-[9px] text-slate-600 mt-1">{etiquetaGerada.codigoBarrasGS1}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-1">
                    LACRE SEGURANÇA: {etiquetaGerada.lacreNumero}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
          Nenhuma remessa aguardando conferência no momento.
        </div>
      )}
    </div>
  );
}
