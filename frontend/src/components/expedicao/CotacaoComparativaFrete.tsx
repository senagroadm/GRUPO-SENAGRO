'use client';

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingDown,
  Truck,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Scale,
  Boxes,
  MapPin,
  FileSpreadsheet,
  Plus,
  Trash2,
  Calculator,
  Percent,
  Clock,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Transportadora, TabelaFrete, ModalidadeFrete } from '@/backend/modules/expedicao/expedicao-types';
import { Empresa } from '@/backend/core/types/company';

interface CotacaoComparativaProps {
  empresaAtiva: Empresa;
  transportadoras: Transportadora[];
  tabelasFrete: TabelaFrete[];
  onAplicarCotacao?: (cotacao: ResultadoCotacaoTransportadora) => void;
}

export interface ResultadoCotacaoTransportadora {
  transportadoraId: string;
  transportadoraNome: string;
  cnpj: string;
  prazoDiasUteis: number;
  pontualidadeHistoricaPercentual: number;
  modalidade: ModalidadeFrete;
  pesoRealKg: number;
  volumeM3: number;
  pesoCubadoKg: number;
  pesoTarifadoKg: number;
  fretePesoValor: number;
  taxaDespachoValor: number;
  adValoremValor: number;
  grisValor: number;
  pedagioValor: number;
  outrasTaxasValor: number;
  valorTotalFrete: number;
  custoPorKg: number;
  isMenorPreco: boolean;
  isMelhorPrazo: boolean;
  isMelhorPontualidade: boolean;
  ratingRecomendacao: 'MELHOR_CUSTO' | 'MELHOR_SLA' | 'EQUILIBRADO' | 'CONVENCIONAL';
}

export function CotacaoComparativaFrete({
  empresaAtiva,
  transportadoras,
  tabelasFrete,
  onAplicarCotacao,
}: CotacaoComparativaProps) {
  // Inputs de Cotação
  const [cepDestino, setCepDestino] = useState('14096-180');
  const [cidadeDestino, setCidadeDestino] = useState('Ribeirão Preto');
  const [ufDestino, setUfDestino] = useState('SP');
  const [pesoRealKg, setPesoRealKg] = useState<number>(350);
  const [volumeTotalM3, setVolumeTotalM3] = useState<number>(1.8);
  const [valorMercadorias, setValorMercadorias] = useState<number>(18500);
  const [modalidadeFrete, setModalidadeFrete] = useState<ModalidadeFrete>('CIF');
  const [requerColeta, setRequerColeta] = useState(false);
  const [cargaPerigosaOuFragil, setCargaPerigosaOuFragil] = useState(false);

  // Lista de cotações calculadas em tempo real para todas as transportadoras homologadas
  const cotacoesComparadas: ResultadoCotacaoTransportadora[] = useMemo(() => {
    if (pesoRealKg <= 0 || valorMercadorias <= 0) return [];

    const resultados: ResultadoCotacaoTransportadora[] = transportadoras.map((transp) => {
      // Busca tabela de frete da transportadora para a UF destino ou tabela genérica
      const tabela =
        tabelasFrete.find((t) => t.transportadoraId === transp.id && t.ufDestino === ufDestino && t.ativo) ||
        tabelasFrete.find((t) => t.transportadoraId === transp.id && t.ativo) ||
        tabelasFrete[0];

      const fatorCubagem = tabela?.fatorCubagemKgPorM3 || 300;
      const pesoCubado = volumeTotalM3 * fatorCubagem;
      const pesoTarifado = Math.max(pesoRealKg, pesoCubado);

      // 1. Frete Peso
      let fretePeso = 45.0;
      if (tabela?.faixasPeso && tabela.faixasPeso.length > 0) {
        const faixa = tabela.faixasPeso.find((f) => pesoTarifado <= f.pesoAteKg);
        if (faixa) {
          fretePeso = faixa.tipoCobranca === 'VALOR_FIXO' ? faixa.valorKgOuFixo : pesoTarifado * faixa.valorKgOuFixo;
        } else {
          const maiorFaixa = tabela.faixasPeso[tabela.faixasPeso.length - 1];
          fretePeso = pesoTarifado * (maiorFaixa?.valorKgOuFixo || 0.65);
        }
      } else {
        // Fallback dinâmico com variação de mercado
        const tarifaBase = transp.nomeFantasia.toLowerCase().includes('express') ? 0.78 : 0.55;
        fretePeso = Math.max(50, pesoTarifado * tarifaBase);
      }

      // 2. Taxa de Despacho / Coleta
      let taxaDespacho = tabela?.valorFixoDespacho || 40.0;
      if (requerColeta) taxaDespacho += 35.0;

      // 3. Ad-Valorem (Seguro de Carga / RCO)
      const aliquotaAdValorem = tabela?.aliquotaAdValoremPercentual || 0.35;
      const adValorem = (valorMercadorias * aliquotaAdValorem) / 100;

      // 4. GRIS (Gerenciamento de Risco)
      const aliquotaGris = tabela?.aliquotaGrisPercentual || (cargaPerigosaOuFragil ? 0.25 : 0.15);
      const gris = (valorMercadorias * aliquotaGris) / 100;

      // 5. Pedágio (cobrado por fração de 100kg tarifados)
      const fracoes100Kg = Math.ceil(pesoTarifado / 100);
      const valorPedagioFracao = tabela?.valorPedagioPorFracao100kg || 6.2;
      const pedagio = fracoes100Kg * valorPedagioFracao;

      // 6. Outras Taxas
      let outrasTaxas = 0;
      if (cargaPerigosaOuFragil) outrasTaxas += 60.0; // Taxa de manuseio especial

      // Totalizadores
      const valorTotalFrete = parseFloat(
        (fretePeso + taxaDespacho + adValorem + gris + pedagio + outrasTaxas).toFixed(2)
      );
      const custoPorKg = parseFloat((valorTotalFrete / pesoRealKg).toFixed(2));

      // Prazo estimado da transportadora
      let prazoDiasUteis = transp.prazoMedioDias || 3;
      if (ufDestino !== 'SP') prazoDiasUteis += 2;
      if (transp.nomeFantasia.toLowerCase().includes('express') || transp.nomeFantasia.toLowerCase().includes('aéreo')) {
        prazoDiasUteis = Math.max(1, prazoDiasUteis - 1);
      }

      return {
        transportadoraId: transp.id,
        transportadoraNome: transp.nomeFantasia || transp.razaoSocial,
        cnpj: transp.cnpj,
        prazoDiasUteis,
        pontualidadeHistoricaPercentual: transp.taxaPontualidadePercentual || 94.5,
        modalidade: modalidadeFrete,
        pesoRealKg: parseFloat(pesoRealKg.toFixed(2)),
        volumeM3: parseFloat(volumeTotalM3.toFixed(2)),
        pesoCubadoKg: parseFloat(pesoCubado.toFixed(2)),
        pesoTarifadoKg: parseFloat(pesoTarifado.toFixed(2)),
        fretePesoValor: parseFloat(fretePeso.toFixed(2)),
        taxaDespachoValor: parseFloat(taxaDespacho.toFixed(2)),
        adValoremValor: parseFloat(adValorem.toFixed(2)),
        grisValor: parseFloat(gris.toFixed(2)),
        pedagioValor: parseFloat(pedagio.toFixed(2)),
        outrasTaxasValor: parseFloat(outrasTaxas.toFixed(2)),
        valorTotalFrete,
        custoPorKg,
        isMenorPreco: false,
        isMelhorPrazo: false,
        isMelhorPontualidade: false,
        ratingRecomendacao: 'CONVENCIONAL',
      };
    });

    if (resultados.length === 0) return [];

    // Identifica vencedores de cada critério
    const minPreco = Math.min(...resultados.map((r) => r.valorTotalFrete));
    const minPrazo = Math.min(...resultados.map((r) => r.prazoDiasUteis));
    const maxPontualidade = Math.max(...resultados.map((r) => r.pontualidadeHistoricaPercentual));

    return resultados
      .map((r) => {
        const isMenorPreco = r.valorTotalFrete === minPreco;
        const isMelhorPrazo = r.prazoDiasUteis === minPrazo;
        const isMelhorPontualidade = r.pontualidadeHistoricaPercentual === maxPontualidade;

        let ratingRecomendacao: 'MELHOR_CUSTO' | 'MELHOR_SLA' | 'EQUILIBRADO' | 'CONVENCIONAL' = 'CONVENCIONAL';
        if (isMenorPreco) ratingRecomendacao = 'MELHOR_CUSTO';
        else if (isMelhorPrazo && isMelhorPontualidade) ratingRecomendacao = 'MELHOR_SLA';
        else if (r.pontualidadeHistoricaPercentual >= 95 && r.valorTotalFrete <= minPreco * 1.1) {
          ratingRecomendacao = 'EQUILIBRADO';
        }

        return {
          ...r,
          isMenorPreco,
          isMelhorPrazo,
          isMelhorPontualidade,
          ratingRecomendacao,
        };
      })
      .sort((a, b) => a.valorTotalFrete - b.valorTotalFrete);
  }, [
    transportadoras,
    tabelasFrete,
    ufDestino,
    pesoRealKg,
    volumeTotalM3,
    valorMercadorias,
    modalidadeFrete,
    requerColeta,
    cargaPerigosaOuFragil,
  ]);

  const menorPrecoCotacao = cotacoesComparadas.find((c) => c.isMenorPreco);
  const melhorSlaCotacao = cotacoesComparadas.find((c) => c.isMelhorPrazo || c.isMelhorPontualidade);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Central de Cotações */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Central de Cotação de Frete Multi-Transportadora
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                Tabelas Contratadas
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Simulação instantânea entre todas as transportadoras homologadas com cálculo completo de cubagem, peso tarifado, GRIS, Ad-Valorem e pedágio.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Formulário de Parâmetros da Carga (Esquerda) e Cards Comparativos (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parâmetros de Entrada da Carga (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-indigo-600" />
              Parâmetros da Carga
            </h3>
            <span className="text-[11px] text-slate-400">Origem: Fábrica ({empresaAtiva.cidade}/{empresaAtiva.uf})</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Modalidade */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Modalidade de Frete:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalidadeFrete('CIF')}
                  className={`py-2 text-center rounded-lg font-bold border transition-colors ${
                    modalidadeFrete === 'CIF'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  CIF (Conta Fábrica)
                </button>
                <button
                  type="button"
                  onClick={() => setModalidadeFrete('FOB')}
                  className={`py-2 text-center rounded-lg font-bold border transition-colors ${
                    modalidadeFrete === 'FOB'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  FOB (Conta Cliente)
                </button>
              </div>
            </div>

            {/* Destino */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Cidade Destino:</label>
                <input
                  type="text"
                  value={cidadeDestino}
                  onChange={(e) => setCidadeDestino(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">UF:</label>
                <select
                  value={ufDestino}
                  onChange={(e) => setUfDestino(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {['SP', 'MG', 'PR', 'SC', 'RS', 'RJ', 'GO', 'MT', 'MS', 'BA', 'DF'].map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Peso e Volume */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Peso Real (kg):</label>
                <input
                  type="number"
                  value={pesoRealKg}
                  onChange={(e) => setPesoRealKg(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Volume (m³):</label>
                <input
                  type="number"
                  step="0.1"
                  value={volumeTotalM3}
                  onChange={(e) => setVolumeTotalM3(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
            </div>

            {/* Valor da NF */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Valor das Mercadorias (NF-e R$):</label>
              <input
                type="number"
                value={valorMercadorias}
                onChange={(e) => setValorMercadorias(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Base para cálculo de Seguro Ad-Valorem e Gerenciamento de Risco (GRIS).
              </span>
            </div>

            {/* Opcionais / Taxas Especiais */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requerColeta}
                  onChange={(e) => setRequerColeta(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700">Requer taxa de coleta dedicada (+R$ 35,00)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cargaPerigosaOuFragil}
                  onChange={(e) => setCargaPerigosaOuFragil(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700">Carga Frágil / Manuseio Especial (+GRIS)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tabela e Cards Comparativos de Cotação (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Vencedores em Destaque (Menor Custo vs. Melhor Prazo/SLA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vencedor Menor Preço */}
            {menorPrecoCotacao && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-emerald-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Melhor Custo (Menor Frete)
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[10px] rounded-full">
                    Mais Econômico
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-bold text-slate-900">{menorPrecoCotacao.transportadoraNome}</h4>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    R$ {menorPrecoCotacao.valorTotalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <span>Prazo: <strong>{menorPrecoCotacao.prazoDiasUteis} dias úteis</strong></span>
                    <span>•</span>
                    <span>Pontualidade: <strong>{menorPrecoCotacao.pontualidadeHistoricaPercentual}%</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Vencedor Melhor SLA */}
            {melhorSlaCotacao && (
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-indigo-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Melhor Prazo & Pontualidade (SLA)
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-600 text-white font-black text-[10px] rounded-full">
                    Mais Rápido
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-bold text-slate-900">{melhorSlaCotacao.transportadoraNome}</h4>
                  <div className="text-2xl font-black text-indigo-700 mt-1">
                    R$ {melhorSlaCotacao.valorTotalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <span>Prazo: <strong>{melhorSlaCotacao.prazoDiasUteis} dia(s) útil(eis)</strong></span>
                    <span>•</span>
                    <span>Pontualidade: <strong>{melhorSlaCotacao.pontualidadeHistoricaPercentual}%</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid Completo de Todas as Cotações Homologadas */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Ranking Completo de Cotações ({cotacoesComparadas.length} parceiros cotados)
              </h3>
              <span className="text-[11px] text-slate-400">Tabelas Contratuais Ativas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">Transportadora</th>
                    <th className="py-2.5 px-3 font-bold text-center">Prazo</th>
                    <th className="py-2.5 px-3 font-bold text-center">Pontualidade</th>
                    <th className="py-2.5 px-3 font-bold text-right">Peso Tarifado</th>
                    <th className="py-2.5 px-3 font-bold text-right">Frete Peso</th>
                    <th className="py-2.5 px-3 font-bold text-right">Ad-Val + GRIS</th>
                    <th className="py-2.5 px-3 font-bold text-right">Pedágio/Taxas</th>
                    <th className="py-2.5 px-3 font-bold text-right">Frete Total</th>
                    <th className="py-2.5 px-3 font-bold text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cotacoesComparadas.map((c) => (
                    <tr key={c.transportadoraId} className={`hover:bg-slate-50 transition-colors ${c.isMenorPreco ? 'bg-emerald-50/20' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {c.transportadoraNome}
                          {c.isMenorPreco && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded">
                              Menor Preço
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">CNPJ: {c.cnpj}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {c.prazoDiasUteis} dia(s)
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                          {c.pontualidadeHistoricaPercentual}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {c.pesoTarifadoKg} kg
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        R$ {c.fretePesoValor.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        R$ {(c.adValoremValor + c.grisValor).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        R$ {(c.pedagioValor + c.taxaDespachoValor + c.outrasTaxasValor).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                        <span className={c.isMenorPreco ? 'text-emerald-700' : 'text-slate-900'}>
                          R$ {c.valorTotalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-[10px] font-normal text-slate-400">
                          (R$ {c.custoPorKg.toFixed(2)}/kg)
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {onAplicarCotacao && (
                          <button
                            onClick={() => onAplicarCotacao(c)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded transition-colors"
                          >
                            Selecionar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
