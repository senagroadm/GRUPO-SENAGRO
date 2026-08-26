'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowRightLeft,
  DollarSign,
  ShieldCheck,
  History,
  Building,
  Check,
  X,
  FileSpreadsheet,
  Zap,
  Info,
  ChevronRight,
  Eye,
  Sliders,
} from 'lucide-react';
import { EmpresaRecord } from '../../../backend/modules/multi-tenant/types';
import {
  ExtratoBancario,
  ExtratoBancarioItem,
  AuditoriaConciliacaoLog,
  ConfigMapeamentoCsv,
  TipoConciliacao,
} from '../../../backend/modules/bancario/conciliacao-types';
import { conciliacaoService } from '../../../backend/modules/bancario/conciliacao-service';
import { bancarioService } from '../../../backend/modules/bancario/bancario-service';
import { PRESETS_CSV_BANCARIOS } from '../../../backend/modules/bancario/csv-parser';
import { ContaBancaria } from '../../../backend/modules/bancario/bancario-types';
import { EMPRESAS_GRUPO } from '../../../backend/core/types/company';

interface ConciliacaoBancariaViewerProps {
  empresaAtiva: EmpresaRecord;
}

export function ConciliacaoBancariaViewer({ empresaAtiva }: ConciliacaoBancariaViewerProps) {
  // Estados principais
  const [activeTab, setActiveTab] = useState<'conciliacao' | 'importar' | 'extratos' | 'auditoria'>('conciliacao');
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [contaSelecionadaId, setContaSelecionadaId] = useState<string>('TODAS');
  const [extratos, setExtratos] = useState<ExtratoBancario[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaConciliacaoLog[]>([]);
  const [resumo, setResumo] = useState<any>(null);

  // Filtros da tabela de conciliação
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ALTA' | 'MEDIA' | 'PENDENTE' | 'CONCILIADO'>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [tipoTransacaoFiltro, setTipoTransacaoFiltro] = useState<'TODOS' | 'CREDITO' | 'DEBITO'>('TODOS');

  // Estados de Importação
  const [tipoArquivo, setTipoArquivo] = useState<'OFX' | 'CSV'>('OFX');
  const [contaImportacaoId, setContaImportacaoId] = useState<string>('');
  const [conteudoArquivo, setConteudoArquivo] = useState<string>('');
  const [nomeArquivo, setNomeArquivo] = useState<string>('');
  const [autoConciliarAlta, setAutoConciliarAlta] = useState<boolean>(true);
  const [presetSelecionado, setPresetSelecionado] = useState<string>('itau-csv');
  const [configCsvCustom, setConfigCsvCustom] = useState<ConfigMapeamentoCsv>(PRESETS_CSV_BANCARIOS[0].config);
  const [expandirConfigCsv, setExpandirConfigCsv] = useState<boolean>(false);

  // Modais
  const [itemSelecionado, setItemSelecionado] = useState<ExtratoBancarioItem | null>(null);
  const [modalDecisaoAberta, setModalDecisaoAberta] = useState<boolean>(false);
  const [modalDetalhesAberta, setModalDetalhesAberta] = useState<boolean>(false);
  const [modalDesconciliarAberta, setModalDesconciliarAberta] = useState<boolean>(false);
  const [motivoDesconciliacao, setMotivoDesconciliacao] = useState<string>('Ajuste contábil / reclassificação');

  // Formulário de Decisão Manual
  const [tipoDecisao, setTipoDecisao] = useState<TipoConciliacao>('TARIFA_BANCARIA');
  const [decisaoMotivo, setDecisaoMotivo] = useState('');
  const [decisaoContaDestinoId, setDecisaoContaDestinoId] = useState('');
  const [decisaoEmpresaDestinoId, setDecisaoEmpresaDestinoId] = useState('');

  // Toast / Feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregamento de dados
  const carregarDados = useCallback(() => {
    const contas = bancarioService.getContasBancarias(empresaAtiva.id);
    setContasBancarias(contas);
    if (contas.length > 0 && !contaImportacaoId) {
      setContaImportacaoId(contas[0].id);
      setDecisaoContaDestinoId(contas.length > 1 ? contas[1].id : contas[0].id);
    }

    const exts = conciliacaoService.getExtratos(
      empresaAtiva.id,
      contaSelecionadaId === 'TODAS' ? undefined : contaSelecionadaId
    );
    setExtratos(exts);

    const logs = conciliacaoService.getAuditoriaLogs(empresaAtiva.id);
    setAuditoriaLogs(logs);

    const res = conciliacaoService.getResumoConciliacao(empresaAtiva.id);
    setResumo(res);
  }, [empresaAtiva.id, contaSelecionadaId, contaImportacaoId]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) carregarDados();
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [carregarDados]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Coleta todos os itens de extrato com filtros
  const todosItensExtrato: { item: ExtratoBancarioItem; extrato: ExtratoBancario }[] = [];
  extratos.forEach((ext) => {
    ext.itens.forEach((it) => {
      // Filtro de conta
      if (contaSelecionadaId !== 'TODAS' && it.contaBancariaId !== contaSelecionadaId) return;

      // Filtro de status
      if (filtroStatus === 'ALTA' && (it.status === 'CONCILIADO' || it.matchSugerido?.nivelConfianca !== 'ALTA')) return;
      if (filtroStatus === 'MEDIA' && (it.status === 'CONCILIADO' || it.matchSugerido?.nivelConfianca !== 'MEDIA')) return;
      if (filtroStatus === 'PENDENTE' && (it.status === 'CONCILIADO' || it.status === 'SUGERIDO')) return;
      if (filtroStatus === 'CONCILIADO' && it.status !== 'CONCILIADO') return;

      // Filtro tipo transação
      if (tipoTransacaoFiltro !== 'TODOS' && it.tipoTransacao !== tipoTransacaoFiltro) return;

      // Busca texto
      if (buscaTexto) {
        const q = buscaTexto.toLowerCase();
        const matchMemo = it.memo.toLowerCase().includes(q);
        const matchDoc = it.checknum?.toLowerCase().includes(q);
        const matchValor = it.valor.toString().includes(q);
        const matchTarget = it.matchSugerido?.targetDescricao.toLowerCase().includes(q);
        const matchConciliado = it.conciliacaoEfetiva?.targetDescricao.toLowerCase().includes(q);
        if (!matchMemo && !matchDoc && !matchValor && !matchTarget && !matchConciliado) return;
      }

      todosItensExtrato.push({ item: it, extrato: ext });
    });
  });

  // Ação: Confirmar sugestão de match
  const handleConfirmarMatch = async (item: ExtratoBancarioItem) => {
    if (!item.matchSugerido) return;
    setLoading(true);
    try {
      await conciliacaoService.conciliarItem(empresaAtiva.id, {
        empresaId: empresaAtiva.id,
        extratoItemId: item.id,
        tipoConciliacao: item.matchSugerido.tipo,
        targetId: item.matchSugerido.targetId,
        motivo: `Confirmação de sugestão (${item.matchSugerido.scoreTotal}% confiança)`,
        usuarioId: 'u-operador',
        usuarioNome: 'Operador Financeiro',
      });
      showToast(`Lançamento "${item.memo}" conciliado com sucesso!`);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro ao conciliar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ação: Conciliar Todos os de Alta Confiança em Lote
  const handleConciliarTodosAlta = async () => {
    const itensAlta = todosItensExtrato.filter(
      (x) => x.item.status === 'SUGERIDO' && x.item.matchSugerido?.nivelConfianca === 'ALTA'
    );
    if (itensAlta.length === 0) {
      showToast('Nenhum item com Alta Confiança pendente de conciliação.');
      return;
    }
    setLoading(true);
    try {
      let sucessos = 0;
      for (const { item } of itensAlta) {
        if (item.matchSugerido) {
          await conciliacaoService.conciliarItem(empresaAtiva.id, {
            empresaId: empresaAtiva.id,
            extratoItemId: item.id,
            tipoConciliacao: item.matchSugerido.tipo,
            targetId: item.matchSugerido.targetId,
            motivo: `Conciliação em lote (${item.matchSugerido.scoreTotal}% Alta Confiança)`,
            usuarioId: 'u-operador',
            usuarioNome: 'Operador Financeiro',
          });
          sucessos++;
        }
      }
      showToast(`${sucessos} lançamentos de Alta Confiança conciliados com sucesso!`);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro na conciliação em lote: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ação: Decisão Manual
  const handleExecutarDecisaoManual = async () => {
    if (!itemSelecionado) return;
    setLoading(true);
    try {
      await conciliacaoService.conciliarItem(empresaAtiva.id, {
        empresaId: empresaAtiva.id,
        extratoItemId: itemSelecionado.id,
        tipoConciliacao: tipoDecisao,
        contaDestinoId: tipoDecisao === 'TRANSFERENCIA_INTERNA' ? decisaoContaDestinoId : undefined,
        empresaDestinoId: tipoDecisao === 'TRANSFERENCIA_INTERCOMPANY' ? decisaoEmpresaDestinoId : undefined,
        motivo: decisaoMotivo || `Conciliação manual tipo ${tipoDecisao}`,
        usuarioId: 'u-operador',
        usuarioNome: 'Operador Financeiro',
      });
      showToast(`Lançamento manual conciliado como ${tipoDecisao}!`);
      setModalDecisaoAberta(false);
      setItemSelecionado(null);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ação: Desconciliar / Estorno
  const handleExecutarDesconciliacao = async () => {
    if (!itemSelecionado) return;
    setLoading(true);
    try {
      await conciliacaoService.desconciliarItem(
        empresaAtiva.id,
        itemSelecionado.id,
        motivoDesconciliacao,
        'u-operador',
        'Operador Financeiro'
      );
      showToast(`Lançamento desconciliado com sucesso! Trilha de auditoria preservada.`);
      setModalDesconciliarAberta(false);
      setItemSelecionado(null);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro ao desconciliar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Processar Importação
  const handleProcessarImportacao = async () => {
    if (!conteudoArquivo.trim()) {
      showToast('Por favor, cole ou carregue o conteúdo do arquivo OFX ou CSV.');
      return;
    }
    if (!contaImportacaoId) {
      showToast('Selecione a conta bancária de destino.');
      return;
    }

    setLoading(true);
    try {
      if (tipoArquivo === 'OFX') {
        const res = await conciliacaoService.importarOfx(
          empresaAtiva.id,
          contaImportacaoId,
          conteudoArquivo,
          nomeArquivo || `extrato_importado_${Date.now()}.ofx`,
          'u-operador',
          'Operador Financeiro',
          autoConciliarAlta
        );
        showToast(res.mensagem);
      } else {
        const res = await conciliacaoService.importarCsv(
          empresaAtiva.id,
          contaImportacaoId,
          conteudoArquivo,
          configCsvCustom,
          nomeArquivo || `extrato_importado_${Date.now()}.csv`,
          'u-operador',
          'Operador Financeiro',
          autoConciliarAlta
        );
        showToast(res.mensagem);
      }
      setActiveTab('conciliacao');
      setConteudoArquivo('');
      setNomeArquivo('');
      carregarDados();
    } catch (err: any) {
      showToast(`Falha na importação: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Exemplos rápidos
  const carregarExemploOfxItau = () => {
    setTipoArquivo('OFX');
    setNomeArquivo('extrato_itau_fabril_agosto.ofx');
    setConteudoArquivo(`OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20260826120000[-3:BRT]
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>341
<BRANCHID>0435
<ACCTID>910208
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260820
<DTEND>20260826
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260826120000[-3:BRT]
<TRNAMT>28900.00
<FITID>OFX-ITAU-20260826-001
<CHECKNUM>890201
<MEMO>PIX RECEBIDO SCHULZ SA COMPRESSORES 84693183000168 FAT-8902-01
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260826120000[-3:BRT]
<TRNAMT>-12500.00
<FITID>OFX-ITAU-20260826-002
<CHECKNUM>77192
<MEMO>TED PAGTO FORNECEDOR CSN SIDERURGICA NF 88123
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260826120000[-3:BRT]
<TRNAMT>-45.00
<FITID>OFX-ITAU-20260826-003
<CHECKNUM>000000
<MEMO>TAR EMISSAO BOLETO COBRANCA ITAU
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260826120000[-3:BRT]
<TRNAMT>-50000.00
<FITID>OFX-ITAU-20260826-004
<CHECKNUM>55102
<MEMO>TRANSF INTERCOMPANY SENAGRO INDUSTRIA CNPJ 23280366000167
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>345800.50
<DTASOF>20260826
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`);
    showToast('Exemplo OFX Itaú carregado no formulário!');
  };

  const carregarExemploCsvBb = () => {
    setTipoArquivo('CSV');
    setPresetSelecionado('bb-csv');
    const preset = PRESETS_CSV_BANCARIOS.find((p) => p.id === 'bb-csv') || PRESETS_CSV_BANCARIOS[0];
    setConfigCsvCustom(preset.config);
    setNomeArquivo('extrato_banco_brasil_pj.csv');
    setConteudoArquivo(`Data,Histórico,Documento,Valor,Saldo
26/08/2026,PIX RECEBIDO WEG EQUIPAMENTOS ELETRICOS,FAT-8901-01,"14850.00","210000.00"
26/08/2026,TARIFA MANUTENCAO CONTA BB EMPRESAS,000000,"-120.00","209880.00"
26/08/2026,TED FORNECEDOR APERAM INOX TUBOS,NF 4491,"-18500.00","191380.00"
26/08/2026,TRANSF MESMA TITULARIDADE TRITECH CORTE,99201,"-15000.00","176380.00"`);
    showToast('Exemplo CSV Banco do Brasil carregado!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <Info className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium">{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Sub-Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-indigo-600" />
              Conciliação Bancária & Extratos Inteligentes
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Módulo 11 (Financeiro & Bancário)
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Motor de reconciliação de extratos OFX e CSV configurável com auto-matching por níveis de confiança (Alta, Média, Baixa), tarifas e transferências intercompany para o Grupo TRITECH.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={carregarDados}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 border border-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => {
              setActiveTab('importar');
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Importar OFX / CSV
          </button>
        </div>
      </div>

      {/* KPI Cards de Resumo */}
      {resumo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Lançamentos</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{resumo.totalItens}</p>
              <p className="text-xs text-slate-500 mt-0.5">{resumo.totalExtratos} extratos carregados</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between bg-emerald-50/20">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Conciliados</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {resumo.totalConciliados}{' '}
                <span className="text-xs font-medium text-emerald-600">({resumo.taxaConciliacao.toFixed(1)}%)</span>
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">R$ {resumo.valorTotalConciliado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs flex items-center justify-between bg-indigo-50/20">
            <div>
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Alta Confiança</p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">{resumo.totalAltaConfianca}</p>
              <p className="text-xs text-indigo-600 mt-0.5">Auto-conciliáveis (&gt;=85%)</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between bg-amber-50/20">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Sugestões (Média)</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{resumo.totalMediaConfianca}</p>
              <p className="text-xs text-amber-600 mt-0.5">Prontos para 1-clique</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendentes / Baixa</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{resumo.totalPendentes}</p>
              <p className="text-xs text-slate-500 mt-0.5">Requerem decisão manual</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 pt-2 shadow-xs">
        <button
          onClick={() => setActiveTab('conciliacao')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'conciliacao'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Fila de Conciliação Interativa
          {resumo && (resumo.totalAltaConfianca > 0 || resumo.totalMediaConfianca > 0) && (
            <span className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full font-bold">
              {resumo.totalAltaConfianca + resumo.totalMediaConfianca}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('importar')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'importar'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Importação OFX & CSV Configurável
        </button>

        <button
          onClick={() => setActiveTab('extratos')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'extratos'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Extratos Importados ({extratos.length})
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'auditoria'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Trilha de Auditoria SoD
        </button>
      </div>

      {/* ==================================================================== */}
      {/* ABA 1: FILA DE CONCILIAÇÃO INTERATIVA                                */}
      {/* ==================================================================== */}
      {activeTab === 'conciliacao' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Ações em Lote */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Filtro por Conta Bancária */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Conta:</span>
                <select
                  value={contaSelecionadaId}
                  onChange={(e) => setContaSelecionadaId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TODAS">Todas as Contas da Empresa</option>
                  {contasBancarias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bancoNome} - Ag {c.agencia} C/C {c.contaCorrente} ({c.descricao})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Status */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setFiltroStatus('TODOS')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    filtroStatus === 'TODOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({todosItensExtrato.length})
                </button>
                <button
                  onClick={() => setFiltroStatus('ALTA')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                    filtroStatus === 'ALTA' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Alta Confiança
                </button>
                <button
                  onClick={() => setFiltroStatus('MEDIA')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                    filtroStatus === 'MEDIA' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Média Confiança
                </button>
                <button
                  onClick={() => setFiltroStatus('PENDENTE')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    filtroStatus === 'PENDENTE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setFiltroStatus('CONCILIADO')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                    filtroStatus === 'CONCILIADO' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  Conciliados
                </button>
              </div>

              {/* Filtro Tipo Crédito/Débito */}
              <select
                value={tipoTransacaoFiltro}
                onChange={(e: any) => setTipoTransacaoFiltro(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="TODOS">Créditos & Débitos</option>
                <option value="CREDITO">Apenas Entradas (Créditos)</option>
                <option value="DEBITO">Apenas Saídas (Débitos)</option>
              </select>
            </div>

            {/* Ações Rápidas em Lote e Busca */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar histórico, doc, valor..."
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-48 focus:w-64 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleConciliarTodosAlta}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5" />
                Auto-Conciliar Alta Confiança
              </button>
            </div>
          </div>

          {/* Tabela de Extratos & Correspondências */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Data & Conta</th>
                    <th className="py-3 px-4">Histórico do Extrato / Doc</th>
                    <th className="py-3 px-4 text-right">Valor (R$)</th>
                    <th className="py-3 px-4 text-center">Score & Confiança</th>
                    <th className="py-3 px-4">Correspondência Detectada</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todosItensExtrato.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold">Nenhum lançamento encontrado para os filtros selecionados.</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Importe um arquivo OFX ou CSV para iniciar a conciliação desta conta.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    todosItensExtrato.map(({ item, extrato }) => {
                      const isCredito = item.tipoTransacao === 'CREDITO';
                      const isConciliado = item.status === 'CONCILIADO';
                      const match = item.matchSugerido;
                      const score = match?.scoreTotal || 0;
                      const conf = match?.nivelConfianca || 'BAIXA';

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isConciliado ? 'bg-emerald-50/10' : match?.nivelConfianca === 'ALTA' ? 'bg-indigo-50/15' : ''
                          }`}
                        >
                          {/* Data & Conta */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{item.dataTransacao}</span>
                            <span className="text-[11px] text-slate-500">{item.contaBancariaNome || extrato.contaBancariaNome}</span>
                          </td>

                          {/* Histórico */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                  isCredito ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {isCredito ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              </span>
                              <div className="truncate">
                                <span className="font-semibold text-slate-800 block truncate" title={item.memo}>
                                  {item.memo}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>Doc: {item.checknum || 'S/N'}</span>
                                  <span>• FITID: {item.fitid}</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Valor */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span
                              className={`font-bold font-mono text-sm ${
                                isCredito ? 'text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {isCredito ? '+' : '-'} R${' '}
                              {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Score & Confiança */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isConciliado ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                100% Conciliado
                              </span>
                            ) : match ? (
                              <button
                                onClick={() => {
                                  setItemSelecionado(item);
                                  setModalDetalhesAberta(true);
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all hover:scale-105 ${
                                  conf === 'ALTA'
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                                    : conf === 'MEDIA'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {conf === 'ALTA' ? (
                                  <Zap className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                )}
                                <span>{score}% ({conf})</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Correspondência Detectada */}
                          <td className="py-3.5 px-4 max-w-sm">
                            {isConciliado ? (
                              <div>
                                <span className="font-semibold text-emerald-800 block text-xs">
                                  {item.conciliacaoEfetiva?.targetDescricao}
                                </span>
                                <span className="text-[10px] text-emerald-600">
                                  Conciliado em {new Date(item.conciliacaoEfetiva?.dataHoraConciliacao || '').toLocaleString('pt-BR')} por{' '}
                                  {item.conciliacaoEfetiva?.usuarioNome}
                                </span>
                              </div>
                            ) : match ? (
                              <div>
                                <span className="font-semibold text-slate-800 block truncate" title={match.targetDescricao}>
                                  {match.targetDescricao}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {match.detalhesScore.explicacoes.slice(0, 2).map((exp, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm"
                                    >
                                      {exp}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Nenhum match automático encontrado</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isConciliado
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'SUGERIDO'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isConciliado ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setItemSelecionado(item);
                                    setModalDetalhesAberta(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                                  title="Ver Detalhes do Lançamento"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setItemSelecionado(item);
                                    setModalDesconciliarAberta(true);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                                >
                                  Desconciliar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {match && (
                                  <button
                                    onClick={() => handleConfirmarMatch(item)}
                                    disabled={loading}
                                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors flex items-center gap-1"
                                    title="Confirmar correspondência sugerida"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Confirmar
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setItemSelecionado(item);
                                    setDecisaoMotivo(item.memo);
                                    setTipoDecisao(
                                      item.memo.toUpperCase().includes('TAR')
                                        ? 'TARIFA_BANCARIA'
                                        : item.memo.toUpperCase().includes('TRANSF')
                                        ? 'TRANSFERENCIA_INTERCOMPANY'
                                        : isCredito
                                        ? 'BAIXA_RECEBER'
                                        : 'BAIXA_PAGAR'
                                    );
                                    setModalDecisaoAberta(true);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                                >
                                  Decidir...
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 2: IMPORTAÇÃO DE EXTRATOS (OFX & CSV CONFIGURÁVEL)              */}
      {/* ==================================================================== */}
      {activeTab === 'importar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1 e 2: Formulário de Importação */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                  Importar Arquivo de Extrato Bancário
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione a conta bancária da empresa e forneça o arquivo OFX ou CSV.
                </p>
              </div>

              {/* Botões Rápidos de Exemplo */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={carregarExemploOfxItau}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200"
                >
                  Exemplo OFX Itaú
                </button>
                <button
                  type="button"
                  onClick={carregarExemploCsvBb}
                  className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200"
                >
                  Exemplo CSV BB
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formato de Arquivo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Formato do Arquivo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoArquivo('OFX')}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      tipoArquivo === 'OFX'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    OFX (Padrão Bancário)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoArquivo('CSV')}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      tipoArquivo === 'CSV'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    CSV Configurável
                  </button>
                </div>
              </div>

              {/* Conta Bancária */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Conta Bancária de Destino ({empresaAtiva.nomeFantasia})
                </label>
                <select
                  value={contaImportacaoId}
                  onChange={(e) => setContaImportacaoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {contasBancarias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bancoNome} - Ag {c.agencia} C/C {c.contaCorrente} ({c.descricao})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Se for CSV: Seleção de Preset e Mapeamento */}
            {tipoArquivo === 'CSV' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Layout / Preset de Mapeamento CSV
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandirConfigCsv(!expandirConfigCsv)}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    {expandirConfigCsv ? 'Recolher Mapeamento Detalhado' : 'Personalizar Colunas & Separador...'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRESETS_CSV_BANCARIOS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPresetSelecionado(preset.id);
                        setConfigCsvCustom(preset.config);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        presetSelecionado === preset.id
                          ? 'border-indigo-600 bg-white shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white/60 hover:bg-white'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900">{preset.nome}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{preset.descricao}</p>
                    </button>
                  ))}
                </div>

                {/* Configuração Avançada de Colunas CSV */}
                {expandirConfigCsv && (
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">Separador</label>
                      <select
                        value={configCsvCustom.separador}
                        onChange={(e: any) =>
                          setConfigCsvCustom((prev) => ({ ...prev, separador: e.target.value }))
                        }
                        className="w-full mt-1 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      >
                        <option value=";">Ponto e Vírgula (;)</option>
                        <option value=",">Vírgula (,)</option>
                        <option value="\t">Tabulação (\t)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">Formato da Data</label>
                      <select
                        value={configCsvCustom.formatoData}
                        onChange={(e: any) =>
                          setConfigCsvCustom((prev) => ({ ...prev, formatoData: e.target.value }))
                        }
                        className="w-full mt-1 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (26/08/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-26)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">Formato Valor</label>
                      <select
                        value={configCsvCustom.formatoValor}
                        onChange={(e: any) =>
                          setConfigCsvCustom((prev) => ({ ...prev, formatoValor: e.target.value }))
                        }
                        className="w-full mt-1 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      >
                        <option value="BR">Brasileiro (1.234,56)</option>
                        <option value="US">Americano (1,234.56)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">Coluna Data</label>
                      <input
                        type="text"
                        value={configCsvCustom.colunas.dataCol}
                        onChange={(e) =>
                          setConfigCsvCustom((prev) => ({
                            ...prev,
                            colunas: { ...prev.colunas, dataCol: e.target.value },
                          }))
                        }
                        className="w-full mt-1 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Textarea para Conteúdo do Arquivo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Conteúdo do Arquivo ({tipoArquivo})
                </label>
                <input
                  type="text"
                  placeholder="Nome do arquivo (ex: extrato_agosto.ofx)"
                  value={nomeArquivo}
                  onChange={(e) => setNomeArquivo(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md w-64"
                />
              </div>
              <textarea
                rows={9}
                value={conteudoArquivo}
                onChange={(e) => setConteudoArquivo(e.target.value)}
                placeholder={`Cole aqui o conteúdo do arquivo ${tipoArquivo} ou use os botões de exemplo no topo...`}
                className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Checkbox de Auto-Conciliação */}
            <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
              <input
                type="checkbox"
                id="autoConciliarCheck"
                checked={autoConciliarAlta}
                onChange={(e) => setAutoConciliarAlta(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="autoConciliarCheck" className="text-xs text-indigo-950 font-semibold cursor-pointer">
                Executar conciliação e baixa automática para lançamentos com Alta Confiança (&gt;= 85%)
              </label>
            </div>

            {/* Botão de Processar */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConteudoArquivo('')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={handleProcessarImportacao}
                disabled={loading || !conteudoArquivo.trim()}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {loading ? 'Processando & Reconciliando...' : 'Processar & Reconciliar Extrato'}
              </button>
            </div>
          </div>

          {/* Coluna 3: Regras e Diretrizes do Motor */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Regras do Motor de Reconciliação
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800">Idempotência Estrita:</strong>
                    <p className="text-[11px] text-slate-500">
                      O FITID / hash de cada transação é rastreado por conta bancária. Reimportar o mesmo arquivo nunca gera duplicatas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-800">Níveis de Confiança:</strong>
                    <p className="text-[11px] text-slate-500">
                      <strong>Alta (&gt;=85%):</strong> Auto-conciliável.<br />
                      <strong>Média (60-84%):</strong> Sugestão para 1-clique.<br />
                      <strong>Baixa (&lt;60%):</strong> Requer decisão manual.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-800">Matching Multivariável:</strong>
                    <p className="text-[11px] text-slate-500">
                      Ponderação cruzada entre Valor, Vencimento (D±1 a D±7), CNPJ/CPF, Nome do Parceiro, Nº de Documento, Nosso Número e TXID PIX.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-800">Intercompany TRITECH:</strong>
                    <p className="text-[11px] text-slate-500">
                      Detecta transferências entre os 5 CNPJs do grupo e gera lançamentos com auditoria espelhada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contas Ativas da Empresa */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Contas Deste CNPJ</h4>
              {contasBancarias.map((cta) => (
                <div key={cta.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{cta.bancoNome}</span>
                    <span className="text-indigo-600 font-mono">
                      R$ {cta.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Agência {cta.agencia} • C/C {cta.contaCorrente}-{cta.contaDigito}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 3: EXTRATOS IMPORTADOS                                           */}
      {/* ==================================================================== */}
      {activeTab === 'extratos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              Lotes de Extratos Carregados no Sistema
            </h3>
            <span className="text-xs text-slate-500">{extratos.length} extratos arquivados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Arquivo & Formato</th>
                  <th className="py-3 px-4">Conta Bancária</th>
                  <th className="py-3 px-4">Período</th>
                  <th className="py-3 px-4 text-center">Itens & Conciliados</th>
                  <th className="py-3 px-4 text-right">Créditos</th>
                  <th className="py-3 px-4 text-right">Débitos</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Importado Em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extratos.map((ext) => (
                  <tr key={ext.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{ext.nomeArquivo}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Formato {ext.formato} • ID: {ext.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{ext.contaBancariaNome}</span>
                      <span className="text-[10px] text-slate-500">Ag {ext.agencia} • C/C {ext.contaCorrente}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-800">{ext.dataInicio} até {ext.dataFim}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-900">
                        {ext.totalConciliados} / {ext.totalItens}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ({ext.totalItens > 0 ? Math.round((ext.totalConciliados / ext.totalItens) * 100) : 100}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      + R$ {ext.valorTotalCreditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 font-semibold">
                      - R$ {ext.valorTotalDebitos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ext.status === 'TOTALMENTE_CONCILIADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ext.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <span>{new Date(ext.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className="text-[10px] text-slate-400 block">{ext.usuarioImportadorNome}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 4: TRILHA DE AUDITORIA SOD                                      */}
      {/* ==================================================================== */}
      {activeTab === 'auditoria' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Log de Auditoria Imutável (Append-Only)
            </h3>
            <span className="text-xs text-slate-500">Rastreabilidade completa de todas as conciliações e estornos</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {auditoriaLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Nenhum registro de auditoria registrado ainda.</div>
            ) : (
              auditoriaLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      log.acao.includes('AUTO')
                        ? 'bg-indigo-100 text-indigo-700'
                        : log.acao.includes('ESTORNO')
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {log.acao.includes('AUTO') ? (
                      <Zap className="w-4 h-4" />
                    ) : log.acao.includes('ESTORNO') ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{log.acao}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5">{log.motivo}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-mono">
                      <span>Operador: {log.usuarioNome || 'Robô Automático'}</span>
                      <span>• FITID: {log.fitid}</span>
                      {log.matchScore !== undefined && <span>• Score: {log.matchScore}%</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DECISÃO MANUAL DE CONCILIAÇÃO                                 */}
      {/* ==================================================================== */}
      {modalDecisaoAberta && itemSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Decisão Manual de Conciliação
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lançamento de {itemSelecionado.tipoTransacao}: R${' '}
                  {itemSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={() => setModalDecisaoAberta(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-100 p-3 rounded-lg text-xs space-y-1">
                <p className="text-slate-600">
                  <strong className="text-slate-900">Histórico:</strong> {itemSelecionado.memo}
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-900">Data:</strong> {itemSelecionado.dataTransacao} •{' '}
                  <strong className="text-slate-900">Doc:</strong> {itemSelecionado.checknum || 'S/N'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tipo de Classificação Contábil
                </label>
                <select
                  value={tipoDecisao}
                  onChange={(e: any) => setTipoDecisao(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="TARIFA_BANCARIA">Despesa / Tarifa Bancária (IOF, Manutenção, Emissão)</option>
                  <option value="TRANSFERENCIA_INTERNA">Transferência Interna (Entre Contas da Empresa)</option>
                  <option value="TRANSFERENCIA_INTERCOMPANY">Transferência Intercompany (Outro CNPJ TRITECH)</option>
                  <option value="BAIXA_RECEBER">Baixa de Contas a Receber (AR)</option>
                  <option value="BAIXA_PAGAR">Baixa de Contas a Pagar (AP)</option>
                  <option value="LANCAMENTO_AVULSO">Lançamento Avulso / Ajuste de Tesouraria</option>
                </select>
              </div>

              {/* Se for Transferência Interna */}
              {tipoDecisao === 'TRANSFERENCIA_INTERNA' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Conta de Destino / Origem
                  </label>
                  <select
                    value={decisaoContaDestinoId}
                    onChange={(e) => setDecisaoContaDestinoId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  >
                    {contasBancarias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.bancoNome} - Ag {c.agencia} C/C {c.contaCorrente} ({c.descricao})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Se for Transferência Intercompany */}
              {tipoDecisao === 'TRANSFERENCIA_INTERCOMPANY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Empresa de Destino do Grupo TRITECH
                  </label>
                  <select
                    value={decisaoEmpresaDestinoId}
                    onChange={(e) => setDecisaoEmpresaDestinoId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="">Selecione a empresa destino...</option>
                    {EMPRESAS_GRUPO.filter((e) => e.id !== empresaAtiva.id).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nomeFantasia} (CNPJ: {e.cnpj})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Motivo / Observações da Conciliação
                </label>
                <input
                  type="text"
                  value={decisaoMotivo}
                  onChange={(e) => setDecisaoMotivo(e.target.value)}
                  placeholder="Descreva o motivo da classificação..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalDecisaoAberta(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecutarDecisaoManual}
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                {loading ? 'Salvando...' : 'Confirmar & Conciliar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DETALHES DO MATCH & SCORE MULTIVARIÁVEL                       */}
      {/* ==================================================================== */}
      {modalDetalhesAberta && itemSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  Detalhamento do Algoritmo de Matching
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Ponderação multivariável dos critérios avaliados</p>
              </div>
              <button onClick={() => setModalDetalhesAberta(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <div>
                  <span className="text-xs text-indigo-700 font-semibold block">Score Final Ponderado</span>
                  <span className="text-2xl font-black text-indigo-900">
                    {itemSelecionado.matchSugerido?.scoreTotal || 0}%
                  </span>
                </div>
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-full font-bold text-xs">
                  {itemSelecionado.matchSugerido?.nivelConfianca} CONFIANÇA
                </span>
              </div>

              {itemSelecionado.matchSugerido && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Pontuações por Critério</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block uppercase">Valor (Max 35)</span>
                      <strong className="text-slate-900">
                        {itemSelecionado.matchSugerido.detalhesScore.scoreValor} pts
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block uppercase">Data / Vencimento (Max 25)</span>
                      <strong className="text-slate-900">
                        {itemSelecionado.matchSugerido.detalhesScore.scoreData} pts
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block uppercase">Parceiro / CNPJ (Max 25)</span>
                      <strong className="text-slate-900">
                        {itemSelecionado.matchSugerido.detalhesScore.scoreParceiro} pts
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block uppercase">Documento / NF (Max 30)</span>
                      <strong className="text-slate-900">
                        {itemSelecionado.matchSugerido.detalhesScore.scoreDocumento} pts
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Evidências do Match:</h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {itemSelecionado.matchSugerido.detalhesScore.explicacoes.map((exp, idx) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setModalDetalhesAberta(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ESTORNO / DESCONCILIAÇÃO AUDITÁVEL                            */}
      {/* ==================================================================== */}
      {modalDesconciliarAberta && itemSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-rose-100 bg-rose-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Estornar / Desconciliar Lançamento
                </h3>
                <p className="text-xs text-rose-600 mt-0.5">Operação auditada e não-destrutiva</p>
              </div>
              <button onClick={() => setModalDesconciliarAberta(false)} className="text-rose-400 hover:text-rose-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Tem certeza que deseja desconciliar o lançamento <strong>&quot;{itemSelecionado.memo}&quot;</strong> (R${' '}
                {itemSelecionado.valor.toFixed(2)})? O status voltará a ser pendente/sugerido e o evento será registrado na trilha de auditoria.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo do Estorno</label>
                <input
                  type="text"
                  value={motivoDesconciliacao}
                  onChange={(e) => setMotivoDesconciliacao(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalDesconciliarAberta(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecutarDesconciliacao}
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                {loading ? 'Estornando...' : 'Confirmar Estorno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
