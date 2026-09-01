'use client';

import React, { useState, useMemo } from 'react';
import {
  Compass,
  Layers,
  Truck,
  Package,
  Boxes,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Scale,
  Plus,
  Trash2,
  RefreshCw,
  MoveUp,
  MoveDown,
  Sparkles,
  Info,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  Expedicao,
  CargaExpedicao,
  Transportadora,
  VeiculoFrota,
  Motorista,
  TipoTransporte,
} from '@/backend/modules/expedicao/expedicao-types';
import { Empresa } from '@/backend/core/types/company';
import { safeFetchJson } from '../../api/safe-fetch';

interface RoteirizadorConsolidacaoProps {
  empresaAtiva: Empresa;
  expedicoes: Expedicao[];
  transportadoras: Transportadora[];
  veiculos: VeiculoFrota[];
  motoristas: Motorista[];
  onCargaCriada: (novaCarga: CargaExpedicao) => void;
}

interface SugestaoCorredor {
  id: string;
  nomeCorredor: string;
  ufs: string[];
  cidadesExemplo: string[];
  expedicoesDisponiveis: Expedicao[];
  pesoTotalKg: number;
  volumeTotalM3: number;
  valorTotalMercadorias: number;
  custoFracionadoEstimado: number;
  custoLotacaoEstimado: number;
  savingEstimadoValor: number;
  savingPercentual: number;
  tipoVeiculoRecomendado: string;
  capacidadePesoVeiculoKg: number;
  capacidadeVolumeVeiculoM3: number;
}

export function RoteirizadorConsolidacao({
  empresaAtiva,
  expedicoes,
  transportadoras,
  veiculos,
  motoristas,
  onCargaCriada,
}: RoteirizadorConsolidacaoProps) {
  // Expedições elegíveis para agrupamento (não entregues e não alocadas em carga finalizada)
  const expedicoesAbertas = useMemo(() => {
    return expedicoes.filter(
      (e) =>
        e.status !== 'ENTREGUE' &&
        e.status !== 'CANCELADO' &&
        e.status !== 'DEVOLVIDO' &&
        e.status !== 'EM_TRANSITO'
    );
  }, [expedicoes]);

  // Modelos de Veículos Padrão
  const MODELOS_VEICULOS = [
    { tipo: 'VUC', label: 'V.U.C. (Carga Urbana)', capPesoKg: 3000, capVolM3: 15, custoMedioKm: 4.5 },
    { tipo: 'TOCO_3_4', label: 'Toco / 3/4 Médio', capPesoKg: 6000, capVolM3: 30, custoMedioKm: 6.2 },
    { tipo: 'TRUCK', label: 'Truck 6x2 (Pesado)', capPesoKg: 14000, capVolM3: 50, custoMedioKm: 8.5 },
    { tipo: 'CARRETA_BAU', label: 'Carreta Baú / Sider', capPesoKg: 28000, capVolM3: 90, custoMedioKm: 12.0 },
    { tipo: 'CARRETA_PRANCHA', label: 'Carreta Prancha (Especial)', capPesoKg: 32000, capVolM3: 70, custoMedioKm: 14.5 },
  ];

  // Sugestões Automáticas de Agrupamento por Corredor
  const sugestoesCorredores: SugestaoCorredor[] = useMemo(() => {
    const corredoresBase = [
      {
        id: 'corredor-sp-interior',
        nomeCorredor: 'Corredor SP Interior (Ribeirão Preto / Franca / Campinas)',
        ufs: ['SP'],
        cidades: ['Ribeirão Preto', 'Sertãozinho', 'Franca', 'Campinas', 'Araraquara', 'São Carlos', 'Bauru'],
      },
      {
        id: 'corredor-mg-triangulo',
        nomeCorredor: 'Corredor Triângulo Mineiro & Alto Paranaíba (MG)',
        ufs: ['MG'],
        cidades: ['Uberaba', 'Uberlândia', 'Araguari', 'Patos de Minas', 'Belo Horizonte', 'Contagem'],
      },
      {
        id: 'corredor-sul',
        nomeCorredor: 'Corredor Sul (Paraná / Santa Catarina)',
        ufs: ['PR', 'SC', 'RS'],
        cidades: ['Curitiba', 'Londrina', 'Maringá', 'Joinville', 'Itajaí', 'Porto Alegre'],
      },
      {
        id: 'corredor-centro-oeste',
        nomeCorredor: 'Corredor Centro-Oeste / Agro (GO / MT / MS)',
        ufs: ['GO', 'MT', 'MS', 'DF'],
        cidades: ['Goiânia', 'Rio Verde', 'Brasília', 'Rondonópolis', 'Cuiabá', 'Campo Grande'],
      },
    ];

    return corredoresBase.map((c) => {
      const exps = expedicoesAbertas.filter((e) => {
        const uf = e.enderecoEntrega?.uf || 'SP';
        return c.ufs.includes(uf);
      });

      const pesoTotalKg = exps.reduce((acc, e) => acc + (e.pesoBrutoTotalKg || 0), 0);
      const volumeTotalM3 = exps.reduce((acc, e) => acc + (e.volumeM3Total || 0), 0);
      const valorTotalMercadorias = exps.reduce((acc, e) => acc + (e.valorMercadorias || 0), 0);

      // Custo fracionado individual somado
      const custoFracionadoEstimado = exps.reduce((acc, e) => {
        return acc + (e.frete?.valorFreteReal || e.frete?.valorFretePrevisto || 850);
      }, 0);

      // Escolha do veículo ideal
      let veiculoIdeal = MODELOS_VEICULOS[0];
      if (pesoTotalKg > 14000 || volumeTotalM3 > 50) veiculoIdeal = MODELOS_VEICULOS[3];
      else if (pesoTotalKg > 6000 || volumeTotalM3 > 30) veiculoIdeal = MODELOS_VEICULOS[2];
      else if (pesoTotalKg > 3000 || volumeTotalM3 > 15) veiculoIdeal = MODELOS_VEICULOS[1];

      // Custo de lotação fechada (saving médio de 25% a 38% em relação ao fracionado)
      const custoLotacaoEstimado = custoFracionadoEstimado > 0 ? custoFracionadoEstimado * 0.72 : 2400;
      const savingEstimadoValor = Math.max(0, custoFracionadoEstimado - custoLotacaoEstimado);
      const savingPercentual = custoFracionadoEstimado > 0 ? (savingEstimadoValor / custoFracionadoEstimado) * 100 : 28.0;

      return {
        id: c.id,
        nomeCorredor: c.nomeCorredor,
        ufs: c.ufs,
        cidadesExemplo: c.cidades,
        expedicoesDisponiveis: exps,
        pesoTotalKg,
        volumeTotalM3,
        valorTotalMercadorias,
        custoFracionadoEstimado,
        custoLotacaoEstimado,
        savingEstimadoValor,
        savingPercentual: parseFloat(savingPercentual.toFixed(1)),
        tipoVeiculoRecomendado: veiculoIdeal.label,
        capacidadePesoVeiculoKg: veiculoIdeal.capPesoKg,
        capacidadeVolumeVeiculoM3: veiculoIdeal.capVolM3,
      };
    });
  }, [expedicoesAbertas]);

  // Estado do Construtor de Carga Personalizada
  const [selectedExpedicaoIds, setSelectedExpedicaoIds] = useState<string[]>([]);
  const [tipoTransporteSelecionado, setTipoTransporteSelecionado] = useState<TipoTransporte>('TRANSPORTADORA_TERCEIRA');
  const [transportadoraId, setTransportadoraId] = useState<string>('');
  const [veiculoId, setVeiculoId] = useState<string>('');
  const [motoristaId, setMotoristaId] = useState<string>('');
  const [tipoVeiculoModelo, setTipoVeiculoModelo] = useState(MODELOS_VEICULOS[2].tipo);
  const [nomeRota, setNomeRota] = useState('Rota Consolidada Interior SP / MG');
  const [criandoCarga, setCriandoCarga] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Informações do Veículo Ativo para Cálculo de Capacidade
  const veiculoConfig = useMemo(() => {
    const v = MODELOS_VEICULOS.find((m) => m.tipo === tipoVeiculoModelo) || MODELOS_VEICULOS[2];
    return v;
  }, [tipoVeiculoModelo]);

  // Lista ordenada de expedições selecionadas (Sequência de Paradas)
  const expedicoesSelecionadasOrdenadas = useMemo(() => {
    return selectedExpedicaoIds
      .map((id) => expedicoes.find((e) => e.id === id))
      .filter((e): e is Expedicao => Boolean(e));
  }, [selectedExpedicaoIds, expedicoes]);

  // Totais da Carga Atual em Montagem
  const metricasCargaAtual = useMemo(() => {
    let pesoTotalKg = 0;
    let volumeTotalM3 = 0;
    let valorMercadorias = 0;
    let totalVolumes = 0;
    let custoFracionadoTotal = 0;

    expedicoesSelecionadasOrdenadas.forEach((e) => {
      pesoTotalKg += e.pesoBrutoTotalKg || 0;
      volumeTotalM3 += e.volumeM3Total || 0;
      valorMercadorias += e.valorMercadorias || 0;
      totalVolumes += e.quantidadeTotalVolumes || 1;
      custoFracionadoTotal += e.frete?.valorFreteReal || e.frete?.valorFretePrevisto || 800;
    });

    const ocupacaoPesoPercentual =
      veiculoConfig.capPesoKg > 0 ? (pesoTotalKg / veiculoConfig.capPesoKg) * 100 : 0;
    const ocupacaoVolumePercentual =
      veiculoConfig.capVolM3 > 0 ? (volumeTotalM3 / veiculoConfig.capVolM3) * 100 : 0;

    const custoConsolidadoEstimado = custoFracionadoTotal * 0.72;
    const economiaEstimada = Math.max(0, custoFracionadoTotal - custoConsolidadoEstimado);

    return {
      pesoTotalKg: parseFloat(pesoTotalKg.toFixed(2)),
      volumeTotalM3: parseFloat(volumeTotalM3.toFixed(2)),
      valorMercadorias,
      totalVolumes,
      ocupacaoPesoPercentual: parseFloat(ocupacaoPesoPercentual.toFixed(1)),
      ocupacaoVolumePercentual: parseFloat(ocupacaoVolumePercentual.toFixed(1)),
      custoFracionadoTotal,
      custoConsolidadoEstimado,
      economiaEstimada,
    };
  }, [expedicoesSelecionadasOrdenadas, veiculoConfig]);

  // Manipulação da seleção de expedições
  const toggleSelecaoExpedicao = (id: string) => {
    setSelectedExpedicaoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const aplicarSugestaoCorredor = (sugestao: SugestaoCorredor) => {
    const ids = sugestao.expedicoesDisponiveis.map((e) => e.id);
    setSelectedExpedicaoIds(ids);
    setNomeRota(`Carga Consolidada - ${sugestao.nomeCorredor}`);
  };

  // Reordenação de paradas (Drop sequence)
  const moverParada = (index: number, direcao: 'cima' | 'baixo') => {
    const novaLista = [...selectedExpedicaoIds];
    const targetIndex = direcao === 'cima' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= novaLista.length) return;
    const [item] = novaLista.splice(index, 1);
    novaLista.splice(targetIndex, 0, item);
    setSelectedExpedicaoIds(novaLista);
  };

  // Executar criação da Carga Consolidada
  const handleCriarCargaConsolidada = async () => {
    if (selectedExpedicaoIds.length === 0) {
      alert('Selecione ao menos 1 remessa/expedição para consolidar na carga.');
      return;
    }

    setCriandoCarga(true);
    setMensagemSucesso(null);

    const transportadoraSelecionada = transportadoras.find((t) => t.id === transportadoraId);
    const veiculoSelecionado = veiculos.find((v) => v.id === veiculoId);
    const motoristaSelecionado = motoristas.find((m) => m.id === motoristaId);

    const payload = {
      tipoTransporte: tipoTransporteSelecionado,
      transportadoraId: transportadoraId || undefined,
      transportadoraNome: transportadoraSelecionada?.nomeFantasia || transportadoraSelecionada?.razaoSocial,
      veiculoId: veiculoId || undefined,
      veiculoPlaca: veiculoSelecionado?.placa || 'BRA-2E19',
      veiculoModelo: veiculoSelecionado?.modelo || veiculoConfig.label,
      motoristaId: motoristaId || undefined,
      motoristaNome: motoristaSelecionado?.nomeCompleto || 'Marcos Vinícius Silva',
      motoristaCelular: motoristaSelecionado?.celularWhatsApp || '(16) 99881-2200',
      rotaNome: nomeRota,
      cidadesAtendidas: Array.from(
        new Set(expedicoesSelecionadasOrdenadas.map((e) => e.enderecoEntrega.cidade))
      ),
      capacidadeVeiculoKg: veiculoConfig.capPesoKg,
      capacidadeVeiculoM3: veiculoConfig.capVolM3,
      expedicaoIds: selectedExpedicaoIds,
      observacoes: `Carga otimizada via motor de roteirização inteligente. Saving de frete estimado: R$ ${metricasCargaAtual.economiaEstimada.toFixed(2)}.`,
      criadoPor: 'Operador Logístico Sênior',
    };

    try {
      const res = await safeFetchJson<{ success: boolean; carga: CargaExpedicao; message: string }>(
        '/api/v1/expedicao',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-empresa-id': empresaAtiva.id,
          },
          body: JSON.stringify({
            acao: 'criar_carga',
            payload,
          }),
        }
      );

      if (res.success && res.carga) {
        setMensagemSucesso(
          `Carga ${res.carga.numeroCarga} gerada com sucesso! ${selectedExpedicaoIds.length} remessas consolidadas.`
        );
        onCargaCriada(res.carga);
        setSelectedExpedicaoIds([]);
      } else {
        alert(res.error || 'Erro ao gerar carga consolidada.');
      }
    } catch (err: any) {
      alert(`Falha na requisição: ${err.message}`);
    } finally {
      setCriandoCarga(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Roteirização Inteligente */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Planejador de Roteirização & Otimizador de Cargas Consolidadas
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                Economia de Frete
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Agrupe pedidos fracionados em cargas lotação por corredor logístico, maximize a cubagem do caminhão e reduza custos de frete.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium">
            Remessas disponíveis para agrupar: <strong className="text-indigo-600 font-bold">{expedicoesAbertas.length}</strong>
          </span>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
          <button
            onClick={() => setMensagemSucesso(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* SEÇÃO 1: SUGESTÕES INTELIGENTES DE CORREDORES LOGÍSTICOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Oportunidades de Agrupamento Sugeridas pelo Sistema
          </h3>
          <span className="text-xs text-slate-400">Algoritmo de Proximidade de Destino</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sugestoesCorredores.map((sug) => (
            <div
              key={sug.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{sug.nomeCorredor}</h4>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Estados: <span className="font-semibold text-slate-700">{sug.ufs.join(', ')}</span> • {sug.expedicoesDisponiveis.length} remessa(s) prontas
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded border border-emerald-200">
                    -{sug.savingPercentual}% de Frete
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-slate-50 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Massa Total</span>
                    <div className="font-bold text-slate-800">{(sug.pesoTotalKg / 1000).toFixed(2)} ton</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Volume</span>
                    <div className="font-bold text-slate-800">{sug.volumeTotalM3.toFixed(2)} m³</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Saving Estimado</span>
                    <div className="font-black text-emerald-600">
                      R$ {sug.savingEstimadoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Veículo Sugerido: <strong className="text-slate-700">{sug.tipoVeiculoRecomendado}</strong></span>
                  <span>Valor Mercadorias: <strong>R$ {sug.valorTotalMercadorias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {sug.expedicoesDisponiveis.length > 0 ? 'Pronto para consolidação' : 'Sem pedidos pendentes no momento'}
                </span>
                <button
                  disabled={sug.expedicoesDisponiveis.length === 0}
                  onClick={() => aplicarSugestaoCorredor(sug)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Carregar no Roteirizador
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 2: CONSTRUTOR DINÂMICO DE CARGA & SEQUENCIADOR DE PARADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Seleção de Remessas Pendentes (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-indigo-600" />
              1. Selecionar Remessas / Pedidos
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {selectedExpedicaoIds.length} de {expedicoesAbertas.length} selecionadas
            </span>
          </div>

          <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
            {expedicoesAbertas.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Nenhuma expedição aberta disponível para montagem de carga no momento.
              </div>
            ) : (
              expedicoesAbertas.map((exp) => {
                const isSelected = selectedExpedicaoIds.includes(exp.id);
                return (
                  <div
                    key={exp.id}
                    onClick={() => toggleSelecaoExpedicao(exp.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <div>
                          <span className="font-bold text-slate-900">{exp.numeroExpedicao}</span>
                          <span className="text-[11px] text-slate-500 ml-1.5">({exp.numeroPedidoVenda})</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-indigo-700">
                        {exp.enderecoEntrega.cidade}/{exp.enderecoEntrega.uf}
                      </span>
                    </div>

                    <div className="font-medium text-slate-700 mt-1 truncate">
                      {exp.clienteRazaoSocial}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                      <span>Massa: <strong>{exp.pesoBrutoTotalKg} kg</strong></span>
                      <span>Vol: <strong>{exp.volumeM3Total} m³</strong></span>
                      <span>Valor: <strong>R$ {exp.valorMercadorias.toLocaleString('pt-BR')}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Ocupação do Caminhão, Sequência e Fechamento (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              2. Veículo, Capacidade & Sequência de Entregas (Drops)
            </h3>
            <span className="text-xs font-bold text-indigo-600">
              Economia Estimada: R$ {metricasCargaAtual.economiaEstimada.toFixed(2)}
            </span>
          </div>

          {/* Configuração do Veículo e Nome da Rota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Tipo de Veículo / Carroceria:</label>
              <select
                value={tipoVeiculoModelo}
                onChange={(e) => setTipoVeiculoModelo(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {MODELOS_VEICULOS.map((v) => (
                  <option key={v.tipo} value={v.tipo}>
                    {v.label} (Cap: {(v.capPesoKg / 1000).toFixed(0)} ton / {v.capVolM3} m³)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Identificação da Rota / Destino:</label>
              <input
                type="text"
                value={nomeRota}
                onChange={(e) => setNomeRota(e.target.value)}
                placeholder="Ex: Rota SP-Triângulo Mineiro"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Barras de Ocupação da Carroceria (Massa vs. Cubagem) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            {/* Ocupação de Peso */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  Ocupação de Peso (Kg)
                </span>
                <span className={metricasCargaAtual.ocupacaoPesoPercentual > 100 ? 'text-rose-600' : 'text-slate-900'}>
                  {metricasCargaAtual.pesoTotalKg} / {veiculoConfig.capPesoKg} kg ({metricasCargaAtual.ocupacaoPesoPercentual}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    metricasCargaAtual.ocupacaoPesoPercentual > 100
                      ? 'bg-rose-500'
                      : metricasCargaAtual.ocupacaoPesoPercentual >= 80
                      ? 'bg-emerald-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, metricasCargaAtual.ocupacaoPesoPercentual)}%` }}
                />
              </div>
              {metricasCargaAtual.ocupacaoPesoPercentual > 100 && (
                <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Sobrepeso detectado! Reduza volumes.
                </span>
              )}
            </div>

            {/* Ocupação de Volume / Cubagem */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                <span className="flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                  Ocupação Volumétrica (m³)
                </span>
                <span className={metricasCargaAtual.ocupacaoVolumePercentual > 100 ? 'text-rose-600' : 'text-slate-900'}>
                  {metricasCargaAtual.volumeTotalM3} / {veiculoConfig.capVolM3} m³ ({metricasCargaAtual.ocupacaoVolumePercentual}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    metricasCargaAtual.ocupacaoVolumePercentual > 100
                      ? 'bg-rose-500'
                      : metricasCargaAtual.ocupacaoVolumePercentual >= 80
                      ? 'bg-emerald-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, metricasCargaAtual.ocupacaoVolumePercentual)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sequência Ordenada de Descarregamento (LIFO) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Ordem Sequencial de Descarregamento (Drops)
              </span>
              <span className="text-[11px] text-slate-400">Dica: A 1ª entrega deve ser carregada por último na carroceria</span>
            </div>

            {expedicoesSelecionadasOrdenadas.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
                Selecione as remessas ao lado para montar a ordem de paradas.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {expedicoesSelecionadasOrdenadas.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                        {idx + 1}º
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">
                          {exp.clienteRazaoSocial} - <span className="text-indigo-600">{exp.enderecoEntrega.cidade}/{exp.enderecoEntrega.uf}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {exp.numeroExpedicao} • {exp.pesoBrutoTotalKg} kg • {exp.volumeM3Total} m³
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moverParada(idx, 'cima')}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                        title="Subir ordem de entrega"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moverParada(idx, 'baixo')}
                        disabled={idx === expedicoesSelecionadasOrdenadas.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                        title="Descer ordem de entrega"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleSelecaoExpedicao(exp.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                        title="Remover desta carga"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ação Final: Botão de Criação da Carga Consolidada */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span>Total Carga: </span>
              <strong>{(metricasCargaAtual.pesoTotalKg / 1000).toFixed(2)} ton</strong> •{' '}
              <strong>{metricasCargaAtual.volumeTotalM3} m³</strong> •{' '}
              <strong className="text-emerald-700 font-extrabold">
                {metricasCargaAtual.economiaEstimada > 0 ? `Economia: R$ ${metricasCargaAtual.economiaEstimada.toFixed(2)}` : ''}
              </strong>
            </div>

            <button
              disabled={selectedExpedicaoIds.length === 0 || criandoCarga || metricasCargaAtual.ocupacaoPesoPercentual > 110}
              onClick={handleCriarCargaConsolidada}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {criandoCarga ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Gerar Romaneio & Carga Consolidada ({selectedExpedicaoIds.length} pedidos)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
