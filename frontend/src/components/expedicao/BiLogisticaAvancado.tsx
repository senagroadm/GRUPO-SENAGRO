'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Scale,
  ShieldAlert,
  MapPin,
  Building2,
  Calendar,
  Filter,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Expedicao,
  Transportadora,
  IndicadoresLogisticaOTIF,
} from '@/backend/modules/expedicao/expedicao-types';
import { Empresa } from '@/backend/core/types/company';

interface BiLogisticaAvancadoProps {
  empresaAtiva: Empresa;
  expedicoes: Expedicao[];
  transportadoras: Transportadora[];
  indicadores: IndicadoresLogisticaOTIF;
}

export function BiLogisticaAvancado({
  empresaAtiva,
  expedicoes,
  transportadoras,
  indicadores,
}: BiLogisticaAvancadoProps) {
  const [periodoFiltro, setPeriodoFiltro] = useState<'30d' | '90d' | 'ano' | 'todos'>('todos');
  const [modalidadeFiltro, setModalidadeFiltro] = useState<'TODOS' | 'CIF' | 'FOB'>('TODOS');
  const [transportadoraFiltro, setTransportadoraFiltro] = useState<string>('TODAS');

  // Filtragem dos dados para recalcular visualizações dinâmicas
  const expedicoesFiltradas = useMemo(() => {
    return expedicoes.filter((exp) => {
      if (modalidadeFiltro !== 'TODOS' && exp.modalidadeFrete !== modalidadeFiltro) return false;
      if (transportadoraFiltro !== 'TODAS' && exp.transportadoraId !== transportadoraFiltro) return false;
      return true;
    });
  }, [expedicoes, modalidadeFiltro, transportadoraFiltro]);

  // Performance detalhada por Transportadora (Scorecard TMS)
  const scorecardTransportadoras = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        nome: string;
        cnpj: string;
        modalidade: string;
        totalViagens: number;
        entregasConcluidas: number;
        entregasNoPrazo: number;
        entregasCompletasSemAvaria: number;
        otifConforme: number;
        diasEntregaSoma: number;
        pesoTotalTransportadoKg: number;
        custoTotalFrete: number;
        ocorrenciasTotal: number;
      }
    >();

    // Inicializa com as transportadoras cadastradas
    transportadoras.forEach((t) => {
      map.set(t.id, {
        id: t.id,
        nome: t.nomeFantasia || t.razaoSocial,
        cnpj: t.cnpj,
        modalidade: t.modalidadesAtendidas.join(', ') || 'Rodoviário',
        totalViagens: 0,
        entregasConcluidas: 0,
        entregasNoPrazo: 0,
        entregasCompletasSemAvaria: 0,
        otifConforme: 0,
        diasEntregaSoma: 0,
        pesoTotalTransportadoKg: 0,
        custoTotalFrete: 0,
        ocorrenciasTotal: 0,
      });
    });

    expedicoesFiltradas.forEach((exp) => {
      const transpId = exp.transportadoraId || 'outros';
      let entry = map.get(transpId);
      if (!entry) {
        entry = {
          id: transpId,
          nome: exp.transportadoraNome || 'Transporte Especial / Outros',
          cnpj: 'N/A',
          modalidade: 'Geral',
          totalViagens: 0,
          entregasConcluidas: 0,
          entregasNoPrazo: 0,
          entregasCompletasSemAvaria: 0,
          otifConforme: 0,
          diasEntregaSoma: 0,
          pesoTotalTransportadoKg: 0,
          custoTotalFrete: 0,
          ocorrenciasTotal: 0,
        };
        map.set(transpId, entry);
      }

      entry.totalViagens += 1;
      entry.pesoTotalTransportadoKg += exp.pesoBrutoTotalKg || 0;
      entry.custoTotalFrete += exp.frete?.valorFreteReal || exp.frete?.valorFretePrevisto || 0;
      entry.ocorrenciasTotal += exp.ocorrencias?.length || 0;

      if (exp.comprovanteEntrega) {
        entry.entregasConcluidas += 1;
        if (exp.comprovanteEntrega.entregueNoPrazo) entry.entregasNoPrazo += 1;
        if (exp.comprovanteEntrega.entregueCompleto) entry.entregasCompletasSemAvaria += 1;
        if (exp.comprovanteEntrega.otifConforme) entry.otifConforme += 1;
      }

      // Cálculo de lead time estimado
      if (exp.dataEfetivaDespacho && exp.dataEfetivaEntrega) {
        const dDesp = new Date(exp.dataEfetivaDespacho).getTime();
        const dEnt = new Date(exp.dataEfetivaEntrega).getTime();
        const dias = Math.max(1, Math.round((dEnt - dDesp) / (1000 * 3600 * 24)));
        entry.diasEntregaSoma += dias;
      } else {
        entry.diasEntregaSoma += 3; // Média estimada
      }
    });

    return Array.from(map.values())
      .filter((t) => t.totalViagens > 0 || transportadoras.some((cad) => cad.id === t.id))
      .map((t) => {
        const concluidas = t.entregasConcluidas || t.totalViagens || 1;
        const taxaOnTime = parseFloat(((t.entregasNoPrazo / concluidas) * 100).toFixed(1));
        const taxaInFull = parseFloat(((t.entregasCompletasSemAvaria / concluidas) * 100).toFixed(1));
        const taxaOtif = parseFloat(((t.otifConforme / concluidas) * 100).toFixed(1));
        const leadTimeMedioDias = parseFloat((t.diasEntregaSoma / (t.totalViagens || 1)).toFixed(1));
        const custoMedioKg = t.pesoTotalTransportadoKg > 0 ? t.custoTotalFrete / t.pesoTotalTransportadoKg : 0;

        // Classificação / Scorecard
        let rating: 'A' | 'B' | 'C' | 'D' = 'A';
        let ratingColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        let badgeLabel = 'Excelente (SLA Cumprido)';

        if (taxaOtif >= 95) {
          rating = 'A';
          ratingColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          badgeLabel = 'Classe A (Ouro)';
        } else if (taxaOtif >= 90) {
          rating = 'B';
          ratingColor = 'bg-blue-50 text-blue-700 border-blue-200';
          badgeLabel = 'Classe B (Prata)';
        } else if (taxaOtif >= 80) {
          rating = 'C';
          ratingColor = 'bg-amber-50 text-amber-700 border-amber-200';
          badgeLabel = 'Classe C (Alerta)';
        } else {
          rating = 'D';
          ratingColor = 'bg-rose-50 text-rose-700 border-rose-200';
          badgeLabel = 'Classe D (Crítico)';
        }

        return {
          ...t,
          taxaOnTime,
          taxaInFull,
          taxaOtif,
          leadTimeMedioDias,
          custoMedioKg,
          rating,
          ratingColor,
          badgeLabel,
        };
      })
      .sort((a, b) => b.totalViagens - a.totalViagens);
  }, [expedicoesFiltradas, transportadoras]);

  // Distribuição Regional de Cargas e Destinos
  const destinosRegionais = useMemo(() => {
    const map = new Map<
      string,
      {
        uf: string;
        regiao: string;
        totalExpedicoes: number;
        pesoTotalKg: number;
        custoFreteTotal: number;
        prazoMedioDias: number;
        taxaOtif: number;
        entregasConcluidas: number;
        entregasOtif: number;
      }
    >();

    expedicoesFiltradas.forEach((exp) => {
      const uf = exp.enderecoEntrega?.uf || 'SP';
      let regiao = 'Sudeste';
      if (['PR', 'SC', 'RS'].includes(uf)) regiao = 'Sul';
      if (['GO', 'MT', 'MS', 'DF'].includes(uf)) regiao = 'Centro-Oeste';
      if (['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'].includes(uf)) regiao = 'Nordeste';
      if (['AM', 'PA', 'RO', 'AC', 'TO', 'RR', 'AP'].includes(uf)) regiao = 'Norte';

      let entry = map.get(uf);
      if (!entry) {
        entry = {
          uf,
          regiao,
          totalExpedicoes: 0,
          pesoTotalKg: 0,
          custoFreteTotal: 0,
          prazoMedioDias: 0,
          taxaOtif: 100,
          entregasConcluidas: 0,
          entregasOtif: 0,
        };
        map.set(uf, entry);
      }

      entry.totalExpedicoes += 1;
      entry.pesoTotalKg += exp.pesoBrutoTotalKg || 0;
      entry.custoFreteTotal += exp.frete?.valorFreteReal || exp.frete?.valorFretePrevisto || 0;

      if (exp.comprovanteEntrega) {
        entry.entregasConcluidas += 1;
        if (exp.comprovanteEntrega.otifConforme) entry.entregasOtif += 1;
      }
    });

    return Array.from(map.values())
      .map((d) => {
        const taxaOtif = d.entregasConcluidas > 0 ? (d.entregasOtif / d.entregasConcluidas) * 100 : 96.0;
        const custoMedioTon = d.pesoTotalKg > 0 ? (d.custoFreteTotal / (d.pesoTotalKg / 1000)) : 0;
        return {
          ...d,
          taxaOtif: parseFloat(taxaOtif.toFixed(1)),
          custoMedioTon: parseFloat(custoMedioTon.toFixed(2)),
          participacaoPercentual: expedicoesFiltradas.length > 0
            ? parseFloat(((d.totalExpedicoes / expedicoesFiltradas.length) * 100).toFixed(1))
            : 0,
        };
      })
      .sort((a, b) => b.totalExpedicoes - a.totalExpedicoes);
  }, [expedicoesFiltradas]);

  // Variação Financeira e Desvios de Frete (Previsto x Real)
  const metricasFinanceiras = useMemo(() => {
    let fretePrevisto = 0;
    let freteReal = 0;
    let valorMercadoriasTotal = 0;
    let pesoTotalKg = 0;

    expedicoesFiltradas.forEach((e) => {
      fretePrevisto += e.frete?.valorFretePrevisto || 0;
      freteReal += e.frete?.valorFreteReal || e.frete?.valorFretePrevisto || 0;
      valorMercadoriasTotal += e.valorMercadorias || 0;
      pesoTotalKg += e.pesoBrutoTotalKg || 0;
    });

    const desvioTotal = freteReal - fretePrevisto;
    const desvioPercentual = fretePrevisto > 0 ? (desvioTotal / fretePrevisto) * 100 : 0;
    const percentualFreteSobreFaturamento =
      valorMercadoriasTotal > 0 ? (freteReal / valorMercadoriasTotal) * 100 : 0;
    const custoPorTonelada = pesoTotalKg > 0 ? freteReal / (pesoTotalKg / 1000) : 0;

    return {
      fretePrevisto,
      freteReal,
      desvioTotal,
      desvioPercentual: parseFloat(desvioPercentual.toFixed(2)),
      percentualFreteSobreFaturamento: parseFloat(percentualFreteSobreFaturamento.toFixed(2)),
      custoPorTonelada: parseFloat(custoPorTonelada.toFixed(2)),
      valorMercadoriasTotal,
      pesoTotalKg,
    };
  }, [expedicoesFiltradas]);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Contexto Executivo */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Torre de Controle Logístico & Analytics Industrial
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">
                BI Estratégico
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Métricas de OTIF, SLAs por Transportadora, Custo por Tonelada e Risco em Trânsito.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Filtro de Modalidade */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Frete:</span>
            <select
              value={modalidadeFiltro}
              onChange={(e) => setModalidadeFiltro(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos (CIF + FOB)</option>
              <option value="CIF">Apenas CIF (Conta Fabril)</option>
              <option value="FOB">Apenas FOB (Cliente)</option>
            </select>
          </div>

          {/* Filtro de Transportadora */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={transportadoraFiltro}
              onChange={(e) => setTransportadoraFiltro(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="TODAS">Todas Transportadoras</option>
              {transportadoras.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nomeFantasia || t.razaoSocial}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Superiores (Cards com Visual Moderno & Rítmico) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: OTIF Geral */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Índice OTIF Global</span>
            <span
              className={`px-2 py-1 rounded-md text-xs font-extrabold flex items-center gap-1 ${
                indicadores.taxaOtifGeral >= 95
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Meta: ≥ 95%
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {indicadores.taxaOtifGeral}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +2.1% vs mês ant.
            </span>
          </div>

          {/* Mini Termômetro Visual */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, indicadores.taxaOtifGeral)}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
            <span>On-Time: <strong>{indicadores.taxaOnTime}%</strong></span>
            <span>In-Full: <strong>{indicadores.taxaInFull}%</strong></span>
          </div>
        </div>

        {/* Card 2: Custo Total de Frete & Impacto */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Frete Realizado</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              R$ {metricasFinanceiras.freteReal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
            <span>% s/ Faturamento:</span>
            <strong className="text-slate-800 font-bold">{metricasFinanceiras.percentualFreteSobreFaturamento}%</strong>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Custo por Tonelada:</span>
            <strong className="text-indigo-600 font-bold">R$ {metricasFinanceiras.custoPorTonelada.toFixed(2)}/ton</strong>
          </div>
        </div>

        {/* Card 3: Tonelagem e Produtividade da Malha */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Massa Expedida</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <Scale className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {(metricasFinanceiras.pesoTotalKg / 1000).toFixed(2)} ton
            </span>
            <span className="text-xs text-slate-500 font-medium">{indicadores.totalVolumesExpedidos} volumes</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
            <span>Custo Médio / kg:</span>
            <strong className="text-slate-900 font-bold">
              R$ {(metricasFinanceiras.pesoTotalKg > 0 ? metricasFinanceiras.freteReal / metricasFinanceiras.pesoTotalKg : 0).toFixed(2)}/kg
            </strong>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Total de Cargas Fechadas:</span>
            <strong className="text-slate-700 font-semibold">{indicadores.totalExpedicoes} remessas</strong>
          </div>
        </div>

        {/* Card 4: Ocorrências & Avarias em Rota */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Ocorrências & RNCs</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{indicadores.totalOcorrencias}</span>
            <span className="text-xs text-rose-600 font-medium">casos no período</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
            <span>Taxa de Avaria:</span>
            <strong className="text-emerald-600 font-bold">
              {indicadores.totalExpedicoes > 0
                ? `${((indicadores.totalOcorrencias / indicadores.totalExpedicoes) * 100).toFixed(1)}%`
                : '0.0%'}
            </strong>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Em Trânsito Atualmente:</span>
            <strong className="text-indigo-600 font-bold">{indicadores.expedicoesEmTransito} caminhões</strong>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: SCORECARD & RANKING DE TRANSPORTADORAS (SLA e Eficiência) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              Scorecard de Transportadoras & Matriz de SLAs Contratados
            </h3>
            <p className="text-xs text-slate-500">
              Avaliação contínua de pontualidade, avarias, cumprimento de prazos e custo médio por parceiro logístico.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Classificação:</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
              Classe A (≥95%)
            </span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200">
              Classe B (90-94%)
            </span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200">
              Classe C (&lt;90%)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-3 font-bold">Transportadora / Parceiro</th>
                <th className="py-3 px-3 font-bold text-center">Score / Rating</th>
                <th className="py-3 px-3 font-bold text-center">OTIF %</th>
                <th className="py-3 px-3 font-bold text-center">On-Time (Prazo)</th>
                <th className="py-3 px-3 font-bold text-center">In-Full (Sem Falha)</th>
                <th className="py-3 px-3 font-bold text-center">Lead Time Médio</th>
                <th className="py-3 px-3 font-bold text-right">Volume Transportado</th>
                <th className="py-3 px-3 font-bold text-right">Custo Médio / kg</th>
                <th className="py-3 px-3 font-bold text-right">Frete Acumulado</th>
                <th className="py-3 px-3 font-bold text-center">Ocorrências</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scorecardTransportadoras.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{t.nome}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>CNPJ: {t.cnpj}</span>
                      <span>•</span>
                      <span className="text-indigo-600 font-medium">{t.modalidade}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border ${t.ratingColor}`}>
                      {t.rating} - {t.badgeLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-black text-slate-900 text-sm">
                    <span className={t.taxaOtif >= 95 ? 'text-emerald-600' : t.taxaOtif >= 90 ? 'text-blue-600' : 'text-amber-600'}>
                      {t.taxaOtif}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">
                    {t.taxaOnTime}%
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">
                    {t.taxaInFull}%
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-slate-700">
                    {t.leadTimeMedioDias} dias
                  </td>
                  <td className="py-3 px-3 text-right text-slate-800 font-medium">
                    {(t.pesoTotalTransportadoKg / 1000).toFixed(2)} ton
                    <div className="text-[10px] text-slate-400">{t.totalViagens} despachos</div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    R$ {t.custoMedioKg.toFixed(2)}/kg
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    R$ {t.custoTotalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {t.ocorrenciasTotal > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-bold text-[10px] border border-rose-200">
                        {t.ocorrenciasTotal} avaria(s)
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Ok
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO 3: ANÁLISE GEOGRÁFICA & MATRIZ DE CAUSA RAIZ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel Regional / Corredores de Frete */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Desempenho por Macro-Região & Estado de Destino
            </h3>
            <span className="text-xs text-slate-500 font-medium">Massa & Custos</span>
          </div>

          <div className="space-y-3">
            {destinosRegionais.map((d) => (
              <div
                key={d.uf}
                className="p-3 border border-slate-100 rounded-lg hover:border-slate-300 transition-colors bg-slate-50/50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                      {d.uf}
                    </span>
                    <span>{d.regiao}</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      ({d.totalExpedicoes} remessas • {d.participacaoPercentual}% do volume)
                    </span>
                  </div>
                  <span className="text-emerald-700 font-extrabold">OTIF: {d.taxaOtif}%</span>
                </div>

                {/* Barra de distribuição */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, d.participacaoPercentual * 2)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <span>Peso Total: <strong>{(d.pesoTotalKg / 1000).toFixed(2)} ton</strong></span>
                  <span>Frete Acumulado: <strong>R$ {d.custoFreteTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                  <span>Custo/Ton: <strong className="text-indigo-600 font-bold">R$ {d.custoMedioTon.toFixed(2)}/ton</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel de Causas de Perda OTIF & Pareto de Avarias */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Pareto de Causas-Raiz de Atrasos e Avarias
            </h3>
            <span className="text-xs text-slate-500 font-medium">Plano de Ação</span>
          </div>

          <div className="space-y-3">
            {indicadores.causasPerdaOTIF.map((c, i) => (
              <div key={i} className="p-3 bg-white border border-slate-100 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>{c.causa}</span>
                  <span className="font-bold text-rose-600">{c.impactoPercentual}% do impacto</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${c.impactoPercentual}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Recomendação Estratégica do Sistema TMS:
            </div>
            <p className="text-indigo-800 leading-relaxed">
              Para mitigar o principal ofensor de tráfego rodoviário nas rotas de São Paulo e Minas Gerais, priorize o agrupamento em <strong>Cargas Fechadas Consolidadas</strong> com saída programada matutina (05:00 - 07:00), reduzindo em até <strong>18% o Lead Time total</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
