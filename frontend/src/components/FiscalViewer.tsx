'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Settings,
  PlusCircle,
  Eye,
  FileCode,
  Lock,
  ArrowRight,
  Calculator,
  Percent,
  Server,
  Activity,
  Award,
  ChevronRight,
  Download,
  AlertCircle,
  Zap,
  Building2,
  Tag,
  Hash,
  Upload,
  RotateCcw,
  Ban,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Package,
  Check,
} from 'lucide-react';
import { Empresa, EMPRESAS_GRUPO } from '@/backend/core/types/company';
import {
  ConfiguracaoFiscal,
  RegraTributaria,
  OperacaoFiscal,
  TributacaoProduto,
  TributacaoServico,
  SerieFiscal,
  DocumentoFiscal,
  EventoFiscal,
  CertificadoReferencia,
  IntegracaoFiscalLog,
  EmissaoDocumentoRequest,
  ModeloDocumentoFiscal,
  PreValidacaoResult,
  InutilizacaoRequest,
} from '@/backend/modules/fiscal/fiscal-types';
import { DanfeViewerModal } from './DanfeViewerModal';

interface FiscalViewerProps {
  empresaAtiva: Empresa;
}

export function FiscalViewer({ empresaAtiva }: FiscalViewerProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'documentos' | 'novo_faturamento' | 'importar_xml' | 'inutilizacao' | 'titulos_estoque' | 'motor_regras' | 'operacoes' | 'series_cert' | 'logs'
  >('documentos');

  const [loading, setLoading] = useState(true);
  const [statusServicos, setStatusServicos] = useState<any>(null);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoFiscal | null>(null);
  const [series, setSeries] = useState<SerieFiscal[]>([]);
  const [operacoes, setOperacoes] = useState<OperacaoFiscal[]>([]);
  const [regras, setRegras] = useState<RegraTributaria[]>([]);
  const [tribProdutos, setTribProdutos] = useState<TributacaoProduto[]>([]);
  const [tribServicos, setTribServicos] = useState<TributacaoServico[]>([]);
  const [certificados, setCertificados] = useState<CertificadoReferencia[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoFiscal[]>([]);
  const [logs, setLogs] = useState<IntegracaoFiscalLog[]>([]);
  const [eventos, setEventos] = useState<EventoFiscal[]>([]);
  const [titulos, setTitulos] = useState<any[]>([]);
  const [auditoriaFaturamento, setAuditoriaFaturamento] = useState<any[]>([]);

  // Filtros
  const [filtroModelo, setFiltroModelo] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [termoBusca, setTermoBusca] = useState('');

  // Modais
  const [modalDanfeDoc, setModalDanfeDoc] = useState<DocumentoFiscal | null>(null);
  const [modalDetalhesDoc, setModalDetalhesDoc] = useState<DocumentoFiscal | null>(null);
  const [modalEvento, setModalEvento] = useState<{ doc: DocumentoFiscal; tipo: 'CANCELAMENTO' | 'CARTA_CORRECAO_CCE' } | null>(null);
  const [textoEvento, setTextoEvento] = useState('');
  const [modalXmlViewer, setModalXmlViewer] = useState<string | null>(null);
  const [modalReprocessarDoc, setModalReprocessarDoc] = useState<DocumentoFiscal | null>(null);

  // Formulário Nova Emissão / Faturamento Integrado
  const [formEmissao, setFormEmissao] = useState<{
    modelo: ModeloDocumentoFiscal;
    operacaoCodigo: string;
    finalidade: 'NORMAL' | 'DEVOLUCAO_RETORNO' | 'TRANSFERENCIA';
    chaveReferenciada: string;
    empresaDestinoIntercompanyId: string;
    destinatarioNome: string;
    destinatarioCnpj: string;
    destinatarioUf: string;
    destinatarioCidade: string;
    destinatarioIndicadorIe: '1_CONTRIBUINTE' | '9_NAO_CONTRIBUINTE';
    destinatarioIe: string;
    destinatarioLogradouro: string;
    destinatarioNumero: string;
    destinatarioBairro: string;
    destinatarioCep: string;
    destinatarioIbge: string;
    codigoItem: string;
    descricaoItem: string;
    quantidade: number;
    valorUnitario: number;
    cfopManual: string;
    ncmManual: string;
    loteNumero: string;
    observacoes: string;
  }>({
    modelo: 'NFE_55',
    operacaoCodigo: 'VENDA_IND_ESTADUAL',
    finalidade: 'NORMAL',
    chaveReferenciada: '',
    empresaDestinoIntercompanyId: '',
    destinatarioNome: 'USINAS SIDERÚRGICAS DE MINAS GERAIS S.A.',
    destinatarioCnpj: '60.872.504/0001-23',
    destinatarioUf: 'MG',
    destinatarioCidade: 'Belo Horizonte',
    destinatarioIndicadorIe: '1_CONTRIBUINTE',
    destinatarioIe: '062.456.789.0012',
    destinatarioLogradouro: 'Av. do Contorno',
    destinatarioNumero: '4500',
    destinatarioBairro: 'Funcionários',
    destinatarioCep: '30110-028',
    destinatarioIbge: '3106200',
    codigoItem: 'VLV-IND-300',
    descricaoItem: 'Válvula Esfera Industrial DN 50 Inox 316',
    quantidade: 5,
    valorUnitario: 3500.0,
    cfopManual: '6101',
    ncmManual: '84818099',
    loteNumero: 'LOTE-2026-VALV-01',
    observacoes: 'Pedido de Venda PV-2026-948 / Destinado a industrialização.',
  });

  const [preValidacaoResult, setPreValidacaoResult] = useState<PreValidacaoResult | null>(null);
  const [validando, setValidando] = useState(false);
  const [emitindo, setEmitindo] = useState(false);
  const [feedbackEmissao, setFeedbackEmissao] = useState<{ sucesso: boolean; mensagem: string; efeitos?: any } | null>(null);

  // Formulário de Inutilização
  const [formInutilizacao, setFormInutilizacao] = useState<InutilizacaoRequest>({
    empresaId: empresaAtiva.id,
    modelo: 'NFE_55',
    serie: 1,
    ano: 26,
    numeroInicial: 1050,
    numeroFinal: 1055,
    justificativa: 'Falha no sequenciamento de faturamento do lote industrial por erro de hardware.',
    usuarioId: 'usr-admin',
  });
  const [inutilizando, setInutilizando] = useState(false);
  const [feedbackInutilizacao, setFeedbackInutilizacao] = useState<{ sucesso: boolean; mensagem: string } | null>(null);

  // Formulário de Importação de XML
  const [xmlText, setXmlText] = useState('');
  const [importandoXml, setImportandoXml] = useState(false);
  const [feedbackImportacao, setFeedbackImportacao] = useState<{ sucesso: boolean; mensagem: string; data?: any } | null>(null);

  // Carregar dados da API
  const carregarDados = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/fiscal?empresaId=${empresaAtiva.id}&action=all`);
      const json = await res.json();
      if (json.success && json.data) {
        setConfiguracao(json.data.configuracao);
        setSeries(json.data.series || []);
        setOperacoes(json.data.operacoes || []);
        setRegras(json.data.regras || []);
        setTribProdutos(json.data.tribProdutos || []);
        setTribServicos(json.data.tribServicos || []);
        setCertificados(json.data.certificados || []);
        setDocumentos(json.data.documentos || []);
        setLogs(json.data.logs || []);
        setEventos(json.data.eventos || []);
        setTitulos(json.data.titulos || []);
        setAuditoriaFaturamento(json.data.auditoriaFaturamento || []);
      }

      const resStatus = await fetch(`/api/v1/fiscal?empresaId=${empresaAtiva.id}&action=status-servicos`);
      const jsonStatus = await resStatus.json();
      if (jsonStatus.success) {
        setStatusServicos(jsonStatus.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados fiscais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/v1/fiscal?empresaId=${empresaAtiva.id}&action=all`);
        const json = await res.json();
        if (!ignore && json.success && json.data) {
          setConfiguracao(json.data.configuracao);
          setSeries(json.data.series || []);
          setOperacoes(json.data.operacoes || []);
          setRegras(json.data.regras || []);
          setTribProdutos(json.data.tribProdutos || []);
          setTribServicos(json.data.tribServicos || []);
          setCertificados(json.data.certificados || []);
          setDocumentos(json.data.documentos || []);
          setLogs(json.data.logs || []);
          setEventos(json.data.eventos || []);
          setTitulos(json.data.titulos || []);
          setAuditoriaFaturamento(json.data.auditoriaFaturamento || []);
        }

        const resStatus = await fetch(`/api/v1/fiscal?empresaId=${empresaAtiva.id}&action=status-servicos`);
        const jsonStatus = await resStatus.json();
        if (!ignore && jsonStatus.success) {
          setStatusServicos(jsonStatus.data);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [empresaAtiva.id]);

  // Montar payload de emissão
  const construirPayloadEmissao = (): EmissaoDocumentoRequest => {
    const isIntercompany = formEmissao.operacaoCodigo === 'TRANSFERENCIA_INTERCOMPANY';
    return {
      empresaId: empresaAtiva.id,
      modelo: formEmissao.modelo,
      operacaoFiscalCodigo: formEmissao.operacaoCodigo,
      idempotencyKey: `idemp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      chaveReferenciadaNFe: formEmissao.chaveReferenciada || undefined,
      empresaDestinoIntercompanyId: isIntercompany ? formEmissao.empresaDestinoIntercompanyId : undefined,
      destinatario: {
        tipoPessoa: formEmissao.destinatarioCnpj.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ',
        cnpjCpf: formEmissao.destinatarioCnpj,
        razaoSocialNome: formEmissao.destinatarioNome,
        indicadorIe: formEmissao.destinatarioIndicadorIe,
        inscricaoEstadual: formEmissao.destinatarioIe,
        endereco: {
          logradouro: formEmissao.destinatarioLogradouro,
          numero: formEmissao.destinatarioNumero,
          bairro: formEmissao.destinatarioBairro,
          codigoMunicipioIBGE: formEmissao.destinatarioIbge,
          cidade: formEmissao.destinatarioCidade,
          uf: formEmissao.destinatarioUf,
          cep: formEmissao.destinatarioCep,
          pais: 'BRASIL',
        },
      },
      itens: [
        {
          codigoItem: formEmissao.codigoItem,
          descricao: formEmissao.descricaoItem,
          quantidade: formEmissao.quantidade,
          valorUnitario: formEmissao.valorUnitario,
          valorDesconto: 0,
          cfopManual: formEmissao.cfopManual || undefined,
          ncmManual: formEmissao.ncmManual || undefined,
          loteNumero: formEmissao.loteNumero || undefined,
        },
      ],
      cobranca: {
        duplicatas: [
          {
            numeroDuplicata: '001',
            dataVencimento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            valorParcela: formEmissao.quantidade * formEmissao.valorUnitario,
          },
        ],
      },
      observacoesContribuinte: formEmissao.observacoes,
      usuarioId: 'usr-operador-faturamento',
    };
  };

  // Pré-validação
  const handleExecutarPreValidacao = async () => {
    setValidando(true);
    setFeedbackEmissao(null);
    try {
      const payload = construirPayloadEmissao();
      const res = await fetch('/api/v1/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'pre-validar',
          request: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPreValidacaoResult(json.data);
      } else {
        setFeedbackEmissao({ sucesso: false, mensagem: json.error || 'Erro na pré-validação' });
      }
    } catch (err: any) {
      setFeedbackEmissao({ sucesso: false, mensagem: err.message });
    } finally {
      setValidando(false);
    }
  };

  // Executar Emissão e Faturamento
  const handleEmitirFaturamento = async () => {
    setEmitindo(true);
    setFeedbackEmissao(null);
    try {
      const payload = construirPayloadEmissao();
      const res = await fetch('/api/v1/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'emitir',
          request: payload,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const doc = json.data.documento;
        if (doc.status === 'AUTORIZADO') {
          setFeedbackEmissao({
            sucesso: true,
            mensagem: `Documento Fiscal ${doc.modelo} nº ${doc.numeroDocumento} AUTORIZADO com sucesso! Protocolo: ${doc.protocoloAutorizacao}. Estoque e Financeiro atualizados.`,
            efeitos: json.data.efeitosFaturamento,
          });
        } else {
          setFeedbackEmissao({
            sucesso: false,
            mensagem: `Rejeição SEFAZ (${doc.codigoStatusSefaz}): ${doc.motivoStatusSefaz}`,
          });
        }
        await carregarDados();
      } else {
        setFeedbackEmissao({ sucesso: false, mensagem: json.error || 'Falha na transmissão fiscal' });
      }
    } catch (err: any) {
      setFeedbackEmissao({ sucesso: false, mensagem: err.message });
    } finally {
      setEmitindo(false);
    }
  };

  // Inutilização de Faixa
  const handleInutilizarFaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    setInutilizando(true);
    setFeedbackInutilizacao(null);
    try {
      const res = await fetch('/api/v1/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'inutilizar',
          request: formInutilizacao,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedbackInutilizacao({
          sucesso: true,
          mensagem: `Faixa ${formInutilizacao.numeroInicial} a ${formInutilizacao.numeroFinal} (Série ${formInutilizacao.serie}) INUTILIZADA com sucesso! Protocolo SEFAZ: ${json.data.protocoloInutilizacao}`,
        });
        await carregarDados();
      } else {
        setFeedbackInutilizacao({ sucesso: false, mensagem: json.error || 'Erro na inutilização' });
      }
    } catch (err: any) {
      setFeedbackInutilizacao({ sucesso: false, mensagem: err.message });
    } finally {
      setInutilizando(false);
    }
  };

  // Importação de XML
  const handleImportarXml = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xmlText.trim()) return;
    setImportandoXml(true);
    setFeedbackImportacao(null);
    try {
      const res = await fetch('/api/v1/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'importar-xml',
          xmlConteudo: xmlText,
          usuarioId: 'usr-importador',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedbackImportacao({
          sucesso: true,
          mensagem: json.data.mensagem || 'XML importado com sucesso!',
          data: json.data,
        });
        setXmlText('');
        await carregarDados();
      } else {
        setFeedbackImportacao({ sucesso: false, mensagem: json.error || 'Falha ao processar arquivo XML.' });
      }
    } catch (err: any) {
      setFeedbackImportacao({ sucesso: false, mensagem: err.message });
    } finally {
      setImportandoXml(false);
    }
  };

  // Evento Fiscal (Cancelamento ou CC-e)
  const handleConfirmarEvento = async () => {
    if (!modalEvento || !textoEvento.trim()) return;
    try {
      const res = await fetch('/api/v1/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'evento',
          documentoFiscalId: modalEvento.doc.id,
          tipoEvento: modalEvento.tipo,
          detalhes:
            modalEvento.tipo === 'CANCELAMENTO'
              ? { justificativa: textoEvento }
              : { textoCorrecao: textoEvento },
          usuarioId: 'usr-admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(
          `Evento ${modalEvento.tipo} transmitido com sucesso! Status: ${json.data.evento.statusSefaz} (Protocolo: ${json.data.evento.protocoloEvento})`
        );
        setModalEvento(null);
        setTextoEvento('');
        await carregarDados();
      } else {
        alert(`Erro ao registrar evento: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Exemplo rápido de XML de fornecedor para teste do importador
  const handleCarregarXmlExemplo = () => {
    const xmlMock = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe35260845890123000199550010000084501876543210" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <natOp>VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>8450</nNF>
      <dhEmi>2026-08-25T10:00:00-03:00</dhEmi>
      <tpNF>1</tpNF>
      <cMunFG>3550308</cMunFG>
    </ide>
    <emit>
      <CNPJ>45890123000199</CNPJ>
      <xNome>FORNECEDOR DE MATERIAS-PRIMAS INDUSTRIAIS LTDA</xNome>
      <IE>111444777888</IE>
      <enderEmit>
        <xLgr>Rodovia dos Imigrantes</xLgr>
        <nro>4000</nro>
        <xBairro>Parque Tecnologico</xBairro>
        <cMun>3550308</cMun>
        <xMun>Sao Paulo</xMun>
        <UF>SP</UF>
        <CEP>04321000</CEP>
      </enderEmit>
    </emit>
    <dest>
      <CNPJ>12345678000190</CNPJ>
      <xNome>TRITECH INDUSTRIAL DO BRASIL S.A.</xNome>
      <IE>111222333444</IE>
      <enderDest>
        <xLgr>Av. das Nacoes Industriais</xLgr>
        <nro>1500</nro>
        <xBairro>Distrito Fabril</xBairro>
        <cMun>3550308</cMun>
        <xMun>Sao Paulo</xMun>
        <UF>SP</UF>
        <CEP>04578000</CEP>
      </enderDest>
    </dest>
    <det nItem="1">
      <prod>
        <cProd>ACO-INOX-316L</cProd>
        <xProd>Barra Redonda Aco Inoxidavel Austenitico 316L 50mm</xProd>
        <NCM>72221100</NCM>
        <CFOP>5102</CFOP>
        <uCom>KG</uCom>
        <qCom>150.0000</qCom>
        <vUnCom>85.0000</vUnCom>
        <vProd>12750.00</vProd>
      </prod>
      <imposto>
        <vBC>12750.00</vBC>
        <pICMS>18.00</pICMS>
        <vICMS>2295.00</vICMS>
        <vIPI>637.50</vIPI>
        <vPIS>210.38</vPIS>
        <vCOFINS>969.00</vCOFINS>
      </imposto>
    </det>
    <total>
      <ICMSTot>
        <vProd>12750.00</vProd>
        <vFrete>250.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vBC>13000.00</vBC>
        <vICMS>2340.00</vICMS>
        <vIPI>637.50</vIPI>
        <vPIS>214.50</vPIS>
        <vCOFINS>988.00</vCOFINS>
        <vNF>13637.50</vNF>
      </ICMSTot>
    </total>
    <cobr>
      <dup>
        <nDup>001</nDup>
        <dVenc>2026-09-25</dVenc>
        <vDup>13637.50</vDup>
      </dup>
    </cobr>
    <protNFe>
      <nProt>135260998877665</nProt>
      <dhRecbto>2026-08-25T10:05:00-03:00</dhRecbto>
    </protNFe>
  </infNFe>
</NFe>`;
    setXmlText(xmlMock);
  };

  // Filtragem de Documentos
  const documentosFiltrados = documentos.filter((doc) => {
    if (filtroModelo !== 'TODOS' && doc.modelo !== filtroModelo) return false;
    if (filtroStatus !== 'TODOS' && doc.status !== filtroStatus) return false;
    if (termoBusca) {
      const termo = termoBusca.toLowerCase();
      const matchNum = doc.numeroDocumento.toString().includes(termo);
      const matchChave = doc.chaveAcesso?.toLowerCase().includes(termo);
      const matchDest = doc.destinatario.razaoSocialNome.toLowerCase().includes(termo);
      const matchCnpj = doc.destinatario.cnpjCpf.includes(termo);
      if (!matchNum && !matchChave && !matchDest && !matchCnpj) return false;
    }
    return true;
  });

  return (
    <div id="fiscal-viewer-root" className="space-y-6">
      {/* Visualizador DANFE Modal */}
      <DanfeViewerModal documento={modalDanfeDoc} onClose={() => setModalDanfeDoc(null)} />

      {/* Header do Módulo */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Faturamento & Camada Fiscal Desacoplada</h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded border border-emerald-500/30">
                  NEXUS FISCAL 4.2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Empresa Ativa: <span className="text-slate-200 font-semibold">{empresaAtiva.nomeFantasia}</span> ({empresaAtiva.cnpj}) •{' '}
                {configuracao?.regimeTributario.replace('_', ' ')} • IE: {configuracao?.inscricaoEstadual}
              </p>
            </div>
          </div>
        </div>

        {/* Status SEFAZ e Ações */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60 text-xs flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                statusServicos?.sefazNfe?.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <div>
              <div className="font-semibold text-slate-200">SEFAZ {configuracao?.ufEmissao || 'SP'}</div>
              <div className="text-[10px] text-slate-400">
                {statusServicos?.sefazNfe?.online ? `Online (${statusServicos?.sefazNfe?.tempoMedioRespostaMs}ms)` : 'Offline'}
              </div>
            </div>
          </div>

          <button
            id="btn-recarregar-dados-fiscal"
            onClick={carregarDados}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-abrir-novo-faturamento"
            onClick={() => setActiveSubTab('novo_faturamento')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Faturamento
          </button>
        </div>
      </div>

      {/* Navegação por Sub-Abas */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white p-1 rounded-t-xl overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('documentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'documentos' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Documentos Emitidos ({documentos.length})
        </button>

        <button
          onClick={() => setActiveSubTab('novo_faturamento')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'novo_faturamento' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4 text-emerald-400" />
          Emissão & Faturamento
        </button>

        <button
          onClick={() => setActiveSubTab('importar_xml')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'importar_xml' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4 text-sky-400" />
          Importador de XML
        </button>

        <button
          onClick={() => setActiveSubTab('inutilizacao')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'inutilizacao' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ban className="w-4 h-4 text-amber-400" />
          Inutilização de Numeração
        </button>

        <button
          onClick={() => setActiveSubTab('titulos_estoque')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'titulos_estoque' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Títulos & Estoque ({titulos.length})
        </button>

        <button
          onClick={() => setActiveSubTab('motor_regras')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'motor_regras' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4 text-purple-400" />
          Motor Tributário & IBS/CBS
        </button>

        <button
          onClick={() => setActiveSubTab('operacoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'operacoes' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4 text-orange-400" />
          Operações & CFOPs ({operacoes.length})
        </button>

        <button
          onClick={() => setActiveSubTab('series_cert')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'series_cert' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-400" />
          Séries & Certificados
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'logs' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-400" />
          Logs de Integração ({logs.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: DOCUMENTOS EMITIDOS */}
      {/* ========================================================= */}
      {activeSubTab === 'documentos' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
          {/* Filtros da Tabela */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nº, chave, destinatário ou CNPJ..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-72 focus:outline-hidden focus:border-slate-400 transition"
                />
              </div>

              <select
                value={filtroModelo}
                onChange={(e) => setFiltroModelo(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
              >
                <option value="TODOS">Todos os Modelos</option>
                <option value="NFE_55">NF-e (Mod. 55)</option>
                <option value="NFSE">NFS-e (Serviços)</option>
                <option value="NFCE_65">NFC-e (Mod. 65)</option>
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="AUTORIZADO">Autorizados</option>
                <option value="CANCELADO">Cancelados</option>
                <option value="REJEITADO">Rejeitados</option>
                <option value="RASCUNHO">Rascunhos</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Exibindo <span className="font-bold text-slate-800">{documentosFiltrados.length}</span> documentos
            </div>
          </div>

          {/* Tabela de Documentos */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Modelo / Tipo</th>
                  <th className="py-2.5 px-3">Série / Número</th>
                  <th className="py-2.5 px-3">Data Emissão</th>
                  <th className="py-2.5 px-3">Destinatário / Tomador</th>
                  <th className="py-2.5 px-3">Valor Total</th>
                  <th className="py-2.5 px-3">Status SEFAZ</th>
                  <th className="py-2.5 px-3">Chave de Acesso / Protocolo</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      Nenhum documento fiscal encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  documentosFiltrados.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold ${
                              doc.modelo === 'NFE_55'
                                ? 'bg-blue-100 text-blue-800'
                                : doc.modelo === 'NFSE'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {doc.modelo === 'NFE_55' ? 'NF-e 55' : doc.modelo === 'NFSE' ? 'NFS-e' : 'NFC-e 65'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {doc.tipoOperacao === 'SAIDA' ? 'SAÍDA' : 'ENTRADA'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{doc.naturezaOperacao}</div>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {doc.serie} / {doc.numeroDocumento}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(doc.dataHoraEmissao).toLocaleDateString('pt-BR')}
                        <div className="text-[10px] text-slate-400">
                          {new Date(doc.dataHoraEmissao).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 max-w-[200px] truncate">
                          {doc.destinatario.razaoSocialNome}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {doc.destinatario.cnpjCpf} • {doc.destinatario.endereco.uf}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        R$ {doc.totais.valorTotalDocumento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-2.5 px-3">
                        {doc.status === 'AUTORIZADO' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            AUTORIZADO
                          </span>
                        ) : doc.status === 'CANCELADO' ? (
                          <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            CANCELADO
                          </span>
                        ) : doc.status === 'REJEITADO' ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            REJEITADO ({doc.codigoStatusSefaz || 0})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            {doc.status}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[10px]">
                        {doc.chaveAcesso ? (
                          <div className="text-slate-700 truncate max-w-[160px]" title={doc.chaveAcesso}>
                            {doc.chaveAcesso}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sem chave</span>
                        )}
                        <div className="text-slate-400">Prot: {doc.protocoloAutorizacao || '-'}</div>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Botão Visualizar DANFE */}
                          <button
                            onClick={() => setModalDanfeDoc(doc)}
                            className="p-1.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                            title="Ver DANFE / DANFSE Gráfico"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Botão Ver XML */}
                          <button
                            onClick={() => setModalXmlViewer(doc.xmlDistribuicaoProtocolado || doc.xmlAssinado || '')}
                            className="p-1.5 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                            title="Visualizar XML Oficial"
                          >
                            <FileCode className="w-4 h-4" />
                          </button>

                          {/* Se AUTORIZADO: Carta de Correção e Cancelamento */}
                          {doc.status === 'AUTORIZADO' && (
                            <>
                              <button
                                onClick={() => setModalEvento({ doc, tipo: 'CARTA_CORRECAO_CCE' })}
                                className="px-1.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition"
                                title="Carta de Correção Eletrônica (CC-e)"
                              >
                                CC-e
                              </button>
                              <button
                                onClick={() => setModalEvento({ doc, tipo: 'CANCELAMENTO' })}
                                className="px-1.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition"
                                title="Cancelar Documento Fiscal"
                              >
                                Cancelar
                              </button>
                            </>
                          )}

                          {/* Se REJEITADO: Botão de Reprocessar Seguro */}
                          {doc.status === 'REJEITADO' && (
                            <button
                              onClick={() => {
                                setFormEmissao((prev) => ({
                                  ...prev,
                                  destinatarioNome: doc.destinatario.razaoSocialNome,
                                  destinatarioCnpj: doc.destinatario.cnpjCpf,
                                  valorUnitario: doc.itens[0]?.valorUnitario || 1000,
                                }));
                                setActiveSubTab('novo_faturamento');
                              }}
                              className="px-2 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded transition flex items-center gap-1"
                              title="Corrigir e Reprocessar com Nova Idempotência"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reprocessar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: EMISSÃO & FATURAMENTO INTEGRADO */}
      {/* ========================================================= */}
      {activeSubTab === 'novo_faturamento' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Formulário Principal */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Cockpit de Emissão Fiscal & Faturamento</h3>
                <p className="text-xs text-slate-500">
                  Transmissão síncrona com motor tributário, cálculo de IBS/CBS e efeitos integrados de estoque e financeiro.
                </p>
              </div>
              <span className="text-xs bg-slate-100 font-mono font-bold px-2 py-1 rounded text-slate-700">
                Série 1 • Emissão Normal
              </span>
            </div>

            {/* Seleção do Tipo de Faturamento */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormEmissao((prev) => ({
                    ...prev,
                    modelo: 'NFE_55',
                    operacaoCodigo: 'VENDA_IND_ESTADUAL',
                    finalidade: 'NORMAL',
                  }))
                }
                className={`p-3 rounded-lg border text-left transition ${
                  formEmissao.operacaoCodigo === 'VENDA_IND_ESTADUAL'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  NF-e Saída (Venda)
                </div>
                <div className="text-[10px] text-slate-500 mt-1">CFOP 5101/6101 • Baixa Estoque + Financeiro</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormEmissao((prev) => ({
                    ...prev,
                    modelo: 'NFE_55',
                    operacaoCodigo: 'DEVOLUCAO_VENDA',
                    finalidade: 'DEVOLUCAO_RETORNO',
                    chaveReferenciada: '35260812345678000190550010000010411876543210',
                  }))
                }
                className={`p-3 rounded-lg border text-left transition ${
                  formEmissao.operacaoCodigo === 'DEVOLUCAO_VENDA'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                  NF-e Entrada (Devolução)
                </div>
                <div className="text-[10px] text-slate-500 mt-1">CFOP 1201/2201 • Chave Ref + Entrada Estoque</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormEmissao((prev) => ({
                    ...prev,
                    modelo: 'NFE_55',
                    operacaoCodigo: 'TRANSFERENCIA_INTERCOMPANY',
                    finalidade: 'NORMAL',
                    empresaDestinoIntercompanyId: EMPRESAS_GRUPO.find((e) => e.id !== empresaAtiva.id)?.id || 'empresa-2',
                  }))
                }
                className={`p-3 rounded-lg border text-left transition ${
                  formEmissao.operacaoCodigo === 'TRANSFERENCIA_INTERCOMPANY'
                    ? 'border-purple-600 bg-purple-50/50 text-purple-950 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Transferência Intercompany
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Entre CNPJs do Grupo TRITECH</div>
              </button>
            </div>

            {/* Se Transferência Intercompany: seletor de empresa destino */}
            {formEmissao.operacaoCodigo === 'TRANSFERENCIA_INTERCOMPANY' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs space-y-2">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-700" />
                  Empresa Receptora do Grupo TRITECH:
                </div>
                <select
                  value={formEmissao.empresaDestinoIntercompanyId}
                  onChange={(e) => setFormEmissao((prev) => ({ ...prev, empresaDestinoIntercompanyId: e.target.value }))}
                  className="w-full p-2 bg-white border border-purple-300 rounded font-semibold text-purple-900"
                >
                  {EMPRESAS_GRUPO.filter((emp) => emp.id !== empresaAtiva.id).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nomeFantasia} — CNPJ: {emp.cnpj} ({emp.ramoAtividade})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-purple-700">
                  O faturamento registrará a saída de estoque na empresa emissora e criará automaticamente a contrapartida de
                  entrada de mercadoria com vínculo da chave na empresa destino.
                </p>
              </div>
            )}

            {/* Se Devolução: Chave Referenciada */}
            {formEmissao.operacaoCodigo === 'DEVOLUCAO_VENDA' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1.5">
                <label className="font-bold text-blue-900 block">Chave de Acesso Referenciada (44 dígitos):</label>
                <input
                  type="text"
                  maxLength={44}
                  value={formEmissao.chaveReferenciada}
                  onChange={(e) => setFormEmissao((prev) => ({ ...prev, chaveReferenciada: e.target.value }))}
                  placeholder="35260812345678000190550010000010411876543210"
                  className="w-full p-2 font-mono bg-white border border-blue-300 rounded text-slate-800"
                />
              </div>
            )}

            {/* Dados do Destinatário */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                Destinatário / Tomador
              </div>
              <div className="grid grid-cols-12 gap-3 text-xs">
                <div className="col-span-8">
                  <label className="font-medium text-slate-600">Razão Social / Nome</label>
                  <input
                    type="text"
                    value={formEmissao.destinatarioNome}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, destinatarioNome: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded font-medium text-slate-900 mt-1"
                  />
                </div>
                <div className="col-span-4">
                  <label className="font-medium text-slate-600">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={formEmissao.destinatarioCnpj}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, destinatarioCnpj: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-medium text-slate-900 mt-1"
                  />
                </div>

                <div className="col-span-4">
                  <label className="font-medium text-slate-600">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formEmissao.destinatarioUf}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, destinatarioUf: e.target.value.toUpperCase() }))}
                    className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900 mt-1"
                  />
                </div>
                <div className="col-span-4">
                  <label className="font-medium text-slate-600">Município</label>
                  <input
                    type="text"
                    value={formEmissao.destinatarioCidade}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, destinatarioCidade: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded font-medium text-slate-900 mt-1"
                  />
                </div>
                <div className="col-span-4">
                  <label className="font-medium text-slate-600">Indicador IE</label>
                  <select
                    value={formEmissao.destinatarioIndicadorIe}
                    onChange={(e) =>
                      setFormEmissao((prev) => ({ ...prev, destinatarioIndicadorIe: e.target.value as any }))
                    }
                    className="w-full p-2 border border-slate-300 rounded font-medium text-slate-900 mt-1"
                  >
                    <option value="1_CONTRIBUINTE">1 - Contribuinte ICMS</option>
                    <option value="9_NAO_CONTRIBUINTE">9 - Não Contribuinte</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dados do Item */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-600" />
                Produto / Serviço
              </div>
              <div className="grid grid-cols-12 gap-3 text-xs">
                <div className="col-span-3">
                  <label className="font-medium text-slate-600">Código Item</label>
                  <input
                    type="text"
                    value={formEmissao.codigoItem}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, codigoItem: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900 mt-1"
                  />
                </div>
                <div className="col-span-9">
                  <label className="font-medium text-slate-600">Descrição Comercial</label>
                  <input
                    type="text"
                    value={formEmissao.descricaoItem}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, descricaoItem: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded font-medium text-slate-900 mt-1"
                  />
                </div>

                <div className="col-span-3">
                  <label className="font-medium text-slate-600">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    value={formEmissao.quantidade}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, quantidade: parseFloat(e.target.value) || 1 }))}
                    className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900 mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <label className="font-medium text-slate-600">Valor Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formEmissao.valorUnitario}
                    onChange={(e) =>
                      setFormEmissao((prev) => ({ ...prev, valorUnitario: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900 mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <label className="font-medium text-slate-600">NCM (8 dígitos)</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={formEmissao.ncmManual}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, ncmManual: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded font-mono text-slate-900 mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <label className="font-medium text-slate-600">CFOP</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formEmissao.cfopManual}
                    onChange={(e) => setFormEmissao((prev) => ({ ...prev, cfopManual: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Feedback de Emissão */}
            {feedbackEmissao && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  feedbackEmissao.sucesso
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {feedbackEmissao.mensagem}
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleExecutarPreValidacao}
                disabled={validando}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition"
              >
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                {validando ? 'Validando...' : 'Executar Pré-Validação'}
              </button>

              <button
                type="button"
                onClick={handleEmitirFaturamento}
                disabled={emitindo}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                {emitindo ? 'Transmitindo SEFAZ...' : 'Autorizar & Faturar Documento'}
              </button>
            </div>
          </div>

          {/* Painel Lateral: Resumo de Validação & Totais */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Totais do Documento */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Resumo da Emissão</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Ambiente Homologação</span>
              </div>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Valor dos Produtos:</span>
                  <span className="font-bold text-white">
                    R$ {(formEmissao.quantidade * formEmissao.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ICMS Estimado (18%):</span>
                  <span>
                    R$ {(formEmissao.quantidade * formEmissao.valorUnitario * 0.18).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>PIS / COFINS (9.25%):</span>
                  <span>
                    R$ {(formEmissao.quantidade * formEmissao.valorUnitario * 0.0925).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {configuracao?.habilitarReformaTributariaIbsCbs && (
                  <div className="flex justify-between text-purple-300 border-t border-slate-800 pt-1">
                    <span>Projeção Dual IBS+CBS:</span>
                    <span>
                      R$ {(formEmissao.quantidade * formEmissao.valorUnitario * 0.265).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-400 font-bold text-sm border-t border-slate-800 pt-2">
                  <span>Total da Nota:</span>
                  <span>
                    R$ {(formEmissao.quantidade * formEmissao.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnóstico da Pré-Validação */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Status da Pré-Validação
                </span>
                {preValidacaoResult && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      preValidacaoResult.valido ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {preValidacaoResult.valido ? 'APROVADO' : 'PENDENTE'}
                  </span>
                )}
              </div>

              {preValidacaoResult ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      {preValidacaoResult.resumoValidacoes.empresaOk ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Empresa Emissora</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      {preValidacaoResult.resumoValidacoes.clienteOk ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Destinatário/CNPJ</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      {preValidacaoResult.resumoValidacoes.produtosOk ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Itens e NCM</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      {preValidacaoResult.resumoValidacoes.tributacaoOk ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Tributação / CFOP</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      {preValidacaoResult.resumoValidacoes.certificadoOk ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Certificado Digital</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      {preValidacaoResult.resumoValidacoes.serieOk ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Série e Numeração</span>
                    </div>
                  </div>

                  {preValidacaoResult.erros.length > 0 && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-800 space-y-1 mt-2">
                      <div className="font-bold">Erros Impeditivos:</div>
                      {preValidacaoResult.erros.map((err, i) => (
                        <div key={i}>• {err.mensagem}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-3">
                  Clique em &quot;Executar Pré-Validação&quot; para testar regras tributárias e conformidade SEFAZ antes de emitir.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 3: IMPORTADOR DE XML */}
      {/* ========================================================= */}
      {activeSubTab === 'importar_xml' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Importador de XML de Documentos Fiscais</h3>
              <p className="text-xs text-slate-500">
                Cole o conteúdo XML da NF-e para alimentar estoque automaticamente e registrar contas a pagar para a empresa{' '}
                {empresaAtiva.nomeFantasia}.
              </p>
            </div>
            <button
              onClick={handleCarregarXmlExemplo}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 rounded transition"
            >
              Carregar XML de Exemplo
            </button>
          </div>

          <form onSubmit={handleImportarXml} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Conteúdo do Arquivo XML (procNFe ou infNFe):
              </label>
              <textarea
                rows={12}
                value={xmlText}
                onChange={(e) => setXmlText(e.target.value)}
                placeholder="<NFe xmlns='http://www.portalfiscal.inf.br/nfe'>..."
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-500"
              />
            </div>

            {feedbackImportacao && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  feedbackImportacao.sucesso
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {feedbackImportacao.mensagem}
              </div>
            )}

            <button
              type="submit"
              disabled={importandoXml || !xmlText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition"
            >
              <Upload className="w-4 h-4" />
              {importandoXml ? 'Processando XML...' : 'Importar Documento & Atualizar Estoque'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 4: INUTILIZAÇÃO DE FAIXA DE NUMERAÇÃO */}
      {/* ========================================================= */}
      {activeSubTab === 'inutilizacao' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5 max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Inutilização de Numeração Fiscal</h3>
            <p className="text-xs text-slate-500">
              Solicite a inutilização de faixa ou número isolado de NF-e/NFC-e na SEFAZ quando ocorrer quebra de sequência.
            </p>
          </div>

          <form onSubmit={handleInutilizarFaixa} className="space-y-4 text-xs">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="font-medium text-slate-700">Modelo</label>
                <select
                  value={formInutilizacao.modelo}
                  onChange={(e) => setFormInutilizacao((p) => ({ ...p, modelo: e.target.value as any }))}
                  className="w-full p-2 border border-slate-300 rounded mt-1 font-semibold"
                >
                  <option value="NFE_55">NF-e (55)</option>
                  <option value="NFCE_65">NFC-e (65)</option>
                </select>
              </div>
              <div>
                <label className="font-medium text-slate-700">Série</label>
                <input
                  type="number"
                  value={formInutilizacao.serie}
                  onChange={(e) => setFormInutilizacao((p) => ({ ...p, serie: parseInt(e.target.value, 10) || 1 }))}
                  className="w-full p-2 border border-slate-300 rounded mt-1 font-bold"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700">Número Inicial</label>
                <input
                  type="number"
                  value={formInutilizacao.numeroInicial}
                  onChange={(e) =>
                    setFormInutilizacao((p) => ({ ...p, numeroInicial: parseInt(e.target.value, 10) || 1 }))
                  }
                  className="w-full p-2 border border-slate-300 rounded mt-1 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700">Número Final</label>
                <input
                  type="number"
                  value={formInutilizacao.numeroFinal}
                  onChange={(e) =>
                    setFormInutilizacao((p) => ({ ...p, numeroFinal: parseInt(e.target.value, 10) || 1 }))
                  }
                  className="w-full p-2 border border-slate-300 rounded mt-1 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-700">Justificativa (Mínimo 15 caracteres):</label>
              <textarea
                rows={3}
                value={formInutilizacao.justificativa}
                onChange={(e) => setFormInutilizacao((p) => ({ ...p, justificativa: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded mt-1 text-slate-800"
              />
            </div>

            {feedbackInutilizacao && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  feedbackInutilizacao.sucesso
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {feedbackInutilizacao.mensagem}
              </div>
            )}

            <button
              type="submit"
              disabled={inutilizando || formInutilizacao.justificativa.length < 15}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition"
            >
              {inutilizando ? 'Transmitindo à SEFAZ...' : 'Homologar Inutilização'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 5: TÍTULOS FINANCEIROS & ESTOQUE INTEGRADO */}
      {/* ========================================================= */}
      {activeSubTab === 'titulos_estoque' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Títulos Financeiros & Efeitos Contábeis</h3>
            <p className="text-xs text-slate-500">
              Contas a Receber e Contas a Pagar geradas automaticamente a partir do faturamento das notas fiscais da empresa{' '}
              {empresaAtiva.nomeFantasia}.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Número / Parcela</th>
                  <th className="py-2.5 px-3">Cliente / Fornecedor</th>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3">Valor (R$)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {titulos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                      Nenhum título financeiro registrado para esta empresa.
                    </td>
                  </tr>
                ) : (
                  titulos.map((tit) => (
                    <tr key={tit.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tit.tipo === 'RECEBER' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tit.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">{tit.numeroTitulo}</td>
                      <td className="py-2.5 px-3 font-semibold">{tit.clienteFornecedorNome}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {new Date(tit.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        R$ {tit.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {tit.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">{tit.origem}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 6: MOTOR TRIBUTÁRIO & REGRAS */}
      {/* ========================================================= */}
      {activeSubTab === 'motor_regras' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Regras Tributárias Parametrizadas</h3>
            <p className="text-xs text-slate-500">
              Configurações por UF de origem/destino, tipo de destinatário e regime tributário. Sem regras fiscais hardcoded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regras.map((r) => (
              <div key={r.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{r.nomeRegra}</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                    {r.ufOrigem} ➔ {r.ufDestino}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
                  <div>CST ICMS: {r.cstIcms}</div>
                  <div>Alíq ICMS: {r.aliquotaIcmsBasePercentual}%</div>
                  <div>CST IPI: {r.cstIpi || 'N/A'}</div>
                  <div>Alíq IPI: {r.aliquotaIpiPercentual || 0}%</div>
                  <div>CST PIS: {r.cstPis || '01'}</div>
                  <div>CST COFINS: {r.cstCofins || '01'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 7: OPERAÇÕES FISCAIS & CFOPS */}
      {/* ========================================================= */}
      {activeSubTab === 'operacoes' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Operações Fiscais e CFOPs Cadastrados</h3>
            <p className="text-xs text-slate-500">
              Parametrização de CFOPs estaduais, interestaduais, flags de movimentação de estoque e geração de títulos.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Código / Natureza</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">CFOP Interno</th>
                  <th className="py-2.5 px-3">CFOP Interestadual</th>
                  <th className="py-2.5 px-3">Estoque</th>
                  <th className="py-2.5 px-3">Financeiro</th>
                  <th className="py-2.5 px-3">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operacoes.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold">
                      <div className="text-slate-900">{op.descricaoNatureza}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{op.codigoOperacao}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold">{op.tipoOperacao}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{op.cfopPadraoEstadual}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{op.cfopPadraoInterestadual}</td>
                    <td className="py-2.5 px-3">
                      {op.movimentaEstoque ? (
                        <span className="text-emerald-600 font-bold">SIM</span>
                      ) : (
                        <span className="text-slate-400">NÃO</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {op.geraFinanceiro ? (
                        <span className="text-emerald-600 font-bold">SIM</span>
                      ) : (
                        <span className="text-slate-400">NÃO</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-600">{op.finalidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 8: SÉRIES & CERTIFICADOS */}
      {/* ========================================================= */}
      {activeSubTab === 'series_cert' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-6 bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Séries Fiscais Independentes</h3>
            <div className="space-y-3">
              {series.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>
                      Série {s.serieNumero} • {s.modelo}
                    </span>
                    <span className="text-emerald-700">Último nº: {s.ultimoNumeroUtilizado}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Ambiente: {s.ambiente} • Status: {s.ativo ? 'Ativa' : 'Inativa'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-6 bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Certificados Digitais (A1/A3)</h3>
            <div className="space-y-3">
              {certificados.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{c.aliasNome}</span>
                    <span className="text-emerald-700">{c.status}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Validade: {new Date(c.validoAte).toLocaleDateString('pt-BR')} ({c.diasAteVencimento} dias restantes)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 9: LOGS DE INTEGRAÇÃO SEFAZ */}
      {/* ========================================================= */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Logs de Integração & Diagnóstico SEFAZ</h3>
            <p className="text-xs text-slate-500">
              Rastreabilidade de payloads de envio, tempos de resposta HTTP e códigos de retorno SEFAZ.
            </p>
          </div>

          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">Nenhum log registrado.</div>
            ) : (
              logs.map((lg) => (
                <div key={lg.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-900 font-bold">
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${lg.sucesso ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />
                      {lg.servico}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(lg.timestamp).toLocaleString('pt-BR')} • {lg.tempoRespostaMs}ms
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">{lg.endpointChamado}</div>
                  <div className="text-[10px] text-slate-500 truncate">Retorno: {lg.payloadRetornoFormatado}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Visualizador de XML */}
      {modalXmlViewer !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm">XML do Documento Fiscal</h3>
              <button onClick={() => setModalXmlViewer(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <pre className="p-4 bg-slate-950 font-mono text-xs text-emerald-400 rounded-lg overflow-y-auto flex-1 mt-3 border border-slate-800 whitespace-pre-wrap break-all">
              {modalXmlViewer || 'XML não gerado para este documento.'}
            </pre>
          </div>
        </div>
      )}

      {/* Modal de Evento Fiscal (Cancelamento / CC-e) */}
      {modalEvento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-xl p-6 shadow-2xl w-full max-w-lg border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm">
                {modalEvento.tipo === 'CANCELAMENTO' ? 'Cancelamento de Documento Fiscal' : 'Carta de Correção Eletrônica (CC-e)'}
              </h3>
              <button onClick={() => setModalEvento(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Documento: <strong>NF-e nº {modalEvento.doc.numeroDocumento}</strong> (Série {modalEvento.doc.serie})
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {modalEvento.tipo === 'CANCELAMENTO' ? 'Justificativa do Cancelamento (mín. 15 caracteres):' : 'Texto da Correção (mín. 15 caracteres):'}
              </label>
              <textarea
                rows={4}
                value={textoEvento}
                onChange={(e) => setTextoEvento(e.target.value)}
                placeholder="Informe o motivo detalhado com conformidade fiscal..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalEvento(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmarEvento}
                disabled={textoEvento.trim().length < 15}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg"
              >
                Transmitir Evento à SEFAZ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
