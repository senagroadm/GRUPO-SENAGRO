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
  Barcode,
  QrCode,
  Scan,
  Truck,
  Boxes,
} from 'lucide-react';
import { Empresa, EMPRESAS_GRUPO } from '@/backend/core/types/company';
import { safeFetchJson } from '../api/safe-fetch';
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
  XmlNFeParsed,
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

  // Formulário de Importação de XML & Código de Barras
  const [modoEntradaNFe, setModoEntradaNFe] = useState<'XML' | 'CODIGO_BARRAS'>('CODIGO_BARRAS');
  const [chaveAcessoInput, setChaveAcessoInput] = useState('');
  const [parsedNFePreview, setParsedNFePreview] = useState<XmlNFeParsed | null>(null);
  const [analisandoPreview, setAnalisandoPreview] = useState(false);
  const [xmlText, setXmlText] = useState('');
  const [importandoXml, setImportandoXml] = useState(false);
  const [feedbackImportacao, setFeedbackImportacao] = useState<{ sucesso: boolean; mensagem: string; data?: any } | null>(null);

  // Carregar dados da API
  const carregarDados = async () => {
    try {
      setLoading(true);
      const res = await safeFetchJson<{
        configuracao: ConfiguracaoFiscal;
        series: any[];
        operacoes: any[];
        regras: any[];
        tribProdutos: any[];
        tribServicos: any[];
        certificados: any[];
        documentos: any[];
        logs: any[];
        eventos: any[];
        titulos: any[];
        auditoriaFaturamento: any[];
      }>(`/api/v1/fiscal?empresaId=${empresaAtiva.id}&action=all`);

      if (res.success && res.data) {
        if (res.data.configuracao) setConfiguracao(res.data.configuracao);
        setSeries(res.data.series || []);
        setOperacoes(res.data.operacoes || []);
        setRegras(res.data.regras || []);
        setTribProdutos(res.data.tribProdutos || []);
        setTribServicos(res.data.tribServicos || []);
        setCertificados(res.data.certificados || []);
        setDocumentos(res.data.documentos || []);
        setLogs(res.data.logs || []);
        setEventos(res.data.eventos || []);
        setTitulos(res.data.titulos || []);
        setAuditoriaFaturamento(res.data.auditoriaFaturamento || []);
      }

      const resStatus = await safeFetchJson(`/api/v1/fiscal?empresaId=${empresaAtiva.id}&action=status-servicos`);
      if (resStatus.success && resStatus.data) {
        setStatusServicos(resStatus.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados fiscais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
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

  // Pré-visualização de XML
  const handleParseXmlPreview = async (conteudoXmlOverride?: string) => {
    const xml = conteudoXmlOverride !== undefined ? conteudoXmlOverride : xmlText;
    if (!xml.trim()) return;
    setAnalisandoPreview(true);
    setFeedbackImportacao(null);
    try {
      const res = await fetch('/api/v1/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'parse-xml-preview',
          xmlConteudo: xml,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setParsedNFePreview(json.data);
      } else {
        setFeedbackImportacao({ sucesso: false, mensagem: json.error || 'Erro ao analisar arquivo XML.' });
      }
    } catch (err: any) {
      setFeedbackImportacao({ sucesso: false, mensagem: err.message });
    } finally {
      setAnalisandoPreview(false);
    }
  };

  // Upload de arquivo XML direto
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setXmlText(text);
        handleParseXmlPreview(text);
      }
    };
    reader.readAsText(file);
  };

  // Consulta por Código de Barras / Chave de Acesso (44 dígitos)
  const handleConsultarChavePreview = async (chaveSobrescrita?: string) => {
    const chave = chaveSobrescrita || chaveAcessoInput.replace(/\D/g, '');
    if (!chave || chave.length !== 44) {
      setFeedbackImportacao({
        sucesso: false,
        mensagem: 'A chave de acesso deve conter exatamente 44 dígitos numéricos.',
      });
      return;
    }
    setAnalisandoPreview(true);
    setFeedbackImportacao(null);
    try {
      const res = await fetch('/api/v1/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'consultar-chave-preview',
          chaveAcesso: chave,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setParsedNFePreview(json.data);
      } else {
        setFeedbackImportacao({ sucesso: false, mensagem: json.error || 'Erro ao consultar Chave de Acesso.' });
      }
    } catch (err: any) {
      setFeedbackImportacao({ sucesso: false, mensagem: err.message });
    } finally {
      setAnalisandoPreview(false);
    }
  };

  // Efetivar Importação por Chave de Acesso (Código de Barras)
  const handleImportarPorChaveAcesso = async () => {
    const chave = chaveAcessoInput.replace(/\D/g, '') || parsedNFePreview?.chaveAcesso;
    if (!chave || chave.length !== 44) return;
    setImportandoXml(true);
    setFeedbackImportacao(null);
    try {
      const res = await fetch('/api/v1/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'importar-chave',
          chaveAcesso: chave,
          usuarioId: 'usr-leitor-danfe',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedbackImportacao({
          sucesso: true,
          mensagem: json.data.mensagem || 'Entrada por Código de Barras concluída com sucesso!',
          data: json.data,
        });
        setChaveAcessoInput('');
        setParsedNFePreview(null);
        await carregarDados();
      } else {
        setFeedbackImportacao({ sucesso: false, mensagem: json.error || 'Falha ao processar Chave de Acesso.' });
      }
    } catch (err: any) {
      setFeedbackImportacao({ sucesso: false, mensagem: err.message });
    } finally {
      setImportandoXml(false);
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
        setParsedNFePreview(null);
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
    handleParseXmlPreview(xmlMock);
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
              </div>
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
          id="tab-entrada-nfe"
          onClick={() => setActiveSubTab('importar_xml')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'importar_xml' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Barcode className="w-4 h-4 text-sky-400" />
          Entrada NF-e (XML & Código de Barras)
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
      {/* ABA 3: ENTRADA DE NF-E (XML & LEITOR DE CÓDIGO DE BARRAS) */}
      {/* ========================================================= */}
      {activeSubTab === 'importar_xml' && (
        <div className="space-y-6">
          {/* Cabeçalho do Importador */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-sky-600" />
                  Entrada de Notas Fiscais (Leitor de Código de Barras & XML)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recebimento fiscal automatizado com rateio industrial de custos (Frete, Seguro, IPI e ICMS-ST),
                  alimentação de estoque físico e geração de contas a pagar para <span className="font-semibold text-slate-700">{empresaAtiva.nomeFantasia}</span>.
                </p>
              </div>

              {/* Seletor de Modo */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  id="btn-modo-codigo-barras"
                  onClick={() => {
                    setModoEntradaNFe('CODIGO_BARRAS');
                    setFeedbackImportacao(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    modoEntradaNFe === 'CODIGO_BARRAS'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Barcode className="w-4 h-4" />
                  Código de Barras / Chave (44 Dígitos)
                </button>
                <button
                  type="button"
                  id="btn-modo-xml"
                  onClick={() => {
                    setModoEntradaNFe('XML');
                    setFeedbackImportacao(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    modoEntradaNFe === 'XML'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  Arquivo XML (Layout SEFAZ)
                </button>
              </div>
            </div>

            {/* CONTEÚDO: MODO CÓDIGO DE BARRAS / CHAVE DE ACESSO */}
            {modoEntradaNFe === 'CODIGO_BARRAS' && (
              <div className="mt-5 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Scan className="w-4 h-4 text-sky-600 animate-pulse" />
                      Bipe com Leitor Óptico ou Digite a Chave de Acesso da DANFE:
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          chaveAcessoInput.replace(/\D/g, '').length === 44
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {chaveAcessoInput.replace(/\D/g, '').length} / 44 dígitos
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id="input-chave-acesso-nfe"
                        value={chaveAcessoInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setChaveAcessoInput(val);
                          const digits = val.replace(/\D/g, '');
                          if (digits.length === 44) {
                            handleConsultarChavePreview(digits);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConsultarChavePreview();
                          }
                        }}
                        placeholder="Ex: 35260845890123000199550010000084501876543210"
                        maxLength={54}
                        className="w-full pl-3 pr-10 py-3 bg-white border-2 border-slate-300 focus:border-sky-500 rounded-lg font-mono text-sm tracking-wider text-slate-900 shadow-inner focus:outline-hidden transition"
                        autoFocus
                      />
                      {chaveAcessoInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setChaveAcessoInput('');
                            setParsedNFePreview(null);
                          }}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      id="btn-consultar-chave-sefaz"
                      disabled={analisandoPreview || chaveAcessoInput.replace(/\D/g, '').length !== 44}
                      onClick={() => handleConsultarChavePreview()}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition shrink-0 shadow-xs"
                    >
                      <Search className={`w-4 h-4 ${analisandoPreview ? 'animate-spin' : ''}`} />
                      {analisandoPreview ? 'Consultando...' : 'Consultar DANFE / SEFAZ'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const chaveExemplo = '35260845890123000199550010000084501876543210';
                        setChaveAcessoInput(chaveExemplo);
                        handleConsultarChavePreview(chaveExemplo);
                      }}
                      className="px-3 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition shrink-0"
                    >
                      Simular Chave Exemplo
                    </button>
                  </div>

                  {/* Decomposição Visual da Chave */}
                  {chaveAcessoInput.replace(/\D/g, '').length === 44 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">UF</span>
                        <span className="font-mono font-bold text-slate-800">
                          {chaveAcessoInput.replace(/\D/g, '').substring(0, 2)} (SP)
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Ano/Mês</span>
                        <span className="font-mono font-bold text-slate-800">
                          {chaveAcessoInput.replace(/\D/g, '').substring(2, 6)}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200 col-span-2">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">CNPJ Emitente</span>
                        <span className="font-mono font-bold text-slate-800 truncate block">
                          {chaveAcessoInput.replace(/\D/g, '').substring(6, 20)}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Mod / Série</span>
                        <span className="font-mono font-bold text-slate-800">
                          {chaveAcessoInput.replace(/\D/g, '').substring(20, 22)} / {parseInt(chaveAcessoInput.replace(/\D/g, '').substring(22, 25), 10)}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Número NF</span>
                        <span className="font-mono font-bold text-slate-800">
                          {parseInt(chaveAcessoInput.replace(/\D/g, '').substring(25, 34), 10)}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Emissão</span>
                        <span className="font-mono font-bold text-slate-800">
                          {chaveAcessoInput.replace(/\D/g, '').substring(34, 35) === '1' ? 'Normal' : 'Contingência'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Dígito (DV)</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {chaveAcessoInput.replace(/\D/g, '').substring(43, 44)} (Válido)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTEÚDO: MODO UPLOAD / TEXTO XML */}
            {modoEntradaNFe === 'XML' && (
              <div className="mt-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/50 rounded-xl cursor-pointer transition text-center">
                    <Upload className="w-5 h-5 text-sky-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Selecionar Arquivo .XML ou Arrastar para cá
                      </span>
                      <span className="text-[10px] text-slate-500">Padrão SEFAZ NF-e 4.00 (procNFe ou infNFe)</span>
                    </div>
                    <input
                      type="file"
                      accept=".xml,text/xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleCarregarXmlExemplo}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition shrink-0"
                  >
                    Carregar XML de Exemplo
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ou Cole o Conteúdo do XML Abaixo:
                  </label>
                  <textarea
                    rows={8}
                    value={xmlText}
                    onChange={(e) => {
                      setXmlText(e.target.value);
                      if (e.target.value.includes('<infNFe') || e.target.value.includes('<NFe')) {
                        handleParseXmlPreview(e.target.value);
                      }
                    }}
                    placeholder="<nfeProc xmlns='http://www.portalfiscal.inf.br/nfe'>..."
                    className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={analisandoPreview || !xmlText.trim()}
                    onClick={() => handleParseXmlPreview()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    <Search className={`w-4 h-4 ${analisandoPreview ? 'animate-spin' : ''}`} />
                    {analisandoPreview ? 'Analisando XML...' : 'Analisar Estrutura do XML'}
                  </button>
                </div>
              </div>
            )}

            {feedbackImportacao && (
              <div
                className={`mt-4 p-4 rounded-xl text-xs font-medium border flex items-start gap-3 ${
                  feedbackImportacao.sucesso
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {feedbackImportacao.sucesso ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{feedbackImportacao.mensagem}</div>
                  {feedbackImportacao.data && feedbackImportacao.data.movimentosEstoqueIds && (
                    <div className="mt-1 text-[11px] text-emerald-800 space-y-0.5">
                      <div>• Movimento de Estoque Gerado: <span className="font-mono">{feedbackImportacao.data.movimentosEstoqueIds.join(', ')}</span></div>
                      {feedbackImportacao.data.titulosFinanceirosIds && feedbackImportacao.data.titulosFinanceirosIds.length > 0 && (
                        <div>• Título Financeiro Contas a Pagar: <span className="font-mono">{feedbackImportacao.data.titulosFinanceirosIds.join(', ')}</span></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PAINEL DE CONFERÊNCIA FISCAL E RATEIO INDUSTRIAL */}
          {parsedNFePreview && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
              {/* Header do Card */}
              <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-sky-600 text-white font-bold text-xs rounded">
                      NF-e {parsedNFePreview.numeroDocumento} / Série {parsedNFePreview.serie}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Chave: {parsedNFePreview.chaveAcesso}
                    </span>
                  </div>
                  <h4 className="font-bold text-base mt-1 text-slate-100">
                    {parsedNFePreview.naturezaOperacao}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Valor Total da Nota</span>
                  <span className="font-bold font-mono text-xl text-emerald-400">
                    R$ {parsedNFePreview.totais.valorTotalNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Grid Fornecedor e Destinatário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Emitente (Fornecedor) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        Fornecedor (Emitente)
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        CNPJ: {parsedNFePreview.emitente.cnpjCpf}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{parsedNFePreview.emitente.razaoSocialNome}</div>
                    {parsedNFePreview.emitente.inscricaoEstadual && (
                      <div className="text-slate-600">IE: {parsedNFePreview.emitente.inscricaoEstadual}</div>
                    )}
                    <div className="text-slate-500">
                      {parsedNFePreview.emitente.logradouro}, {parsedNFePreview.emitente.numero} - {parsedNFePreview.emitente.bairro}, {parsedNFePreview.emitente.municipio}/{parsedNFePreview.emitente.uf}
                    </div>
                  </div>

                  {/* Destinatário (Nossa Empresa) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        Destinatário (Nossa Empresa)
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        CNPJ: {parsedNFePreview.destinatario.cnpjCpf}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{parsedNFePreview.destinatario.razaoSocialNome}</div>
                    <div className="text-slate-500">
                      {parsedNFePreview.destinatario.logradouro}, {parsedNFePreview.destinatario.numero} - {parsedNFePreview.destinatario.municipio}/{parsedNFePreview.destinatario.uf}
                    </div>
                    <div className="text-emerald-700 font-semibold mt-1">
                      Destino de Entrada: Almoxarifado Principal de Matéria-Prima ({empresaAtiva.nomeFantasia})
                    </div>
                  </div>
                </div>

                {/* Grade de Itens da Nota e Rateio de Custo */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-sky-600" />
                      Itens Extraídos & Custo Unitário de Aquisição com Rateio Industrial ({parsedNFePreview.itens.length})
                    </h5>
                    <span className="text-[11px] text-slate-500">
                      * Custo = Preço - Desconto + Frete + Seguro + IPI + ST
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Item / Código</th>
                          <th className="py-2.5 px-3">Descrição do Produto</th>
                          <th className="py-2.5 px-3">NCM / CFOP</th>
                          <th className="py-2.5 px-3 text-right">Qtd / UN</th>
                          <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                          <th className="py-2.5 px-3 text-right">Frete/Seg Rateado</th>
                          <th className="py-2.5 px-3 text-right">IPI Rateado</th>
                          <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-900 font-extrabold">Custo Aquisição Unit.</th>
                          <th className="py-2.5 px-3 text-right">Total Item</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {parsedNFePreview.itens.map((it) => (
                          <tr key={it.numeroItem} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              #{it.numeroItem} - {it.codigoProduto}
                              {it.loteNumero && (
                                <span className="block text-[10px] text-sky-600 font-sans">Lote: {it.loteNumero}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-900 font-medium">
                              {it.descricao}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                              NCM: {it.ncm} | CFOP: {it.cfop}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                              {it.quantidade.toLocaleString('pt-BR')} {it.unidadeMedida}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              R$ {it.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 text-[11px]">
                              + R$ {(it.valorFreteRateado + it.valorSeguroRateado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 text-[11px]">
                              + R$ {it.valorIpi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/70">
                              R$ {it.custoAquisicaoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              R$ {it.custoAquisicaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumo de Totais Fiscais & Financeiro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Totais Fiscais */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                      Totais da Nota Fiscal (SEFAZ)
                    </span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-slate-700">
                      <div className="flex justify-between">
                        <span>Total dos Produtos:</span>
                        <span className="font-semibold">R$ {parsedNFePreview.totais.valorProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frete Total:</span>
                        <span className="font-semibold">R$ {parsedNFePreview.totais.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seguro / Despesas:</span>
                        <span className="font-semibold">R$ {(parsedNFePreview.totais.valorSeguro + (parsedNFePreview.totais.valorOutrasDespesas || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Descontos:</span>
                        <span className="font-semibold text-rose-600">- R$ {parsedNFePreview.totais.valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IPI Total:</span>
                        <span className="font-semibold">R$ {parsedNFePreview.totais.valorIpi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ICMS Total:</span>
                        <span className="font-semibold">R$ {parsedNFePreview.totais.valorIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financeiro (Contas a Pagar / Duplicatas) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>Condição de Pagamento (Contas a Pagar)</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {parsedNFePreview.cobranca?.duplicatas.length || 1} Parcela(s)
                      </span>
                    </span>
                    <div className="space-y-1.5">
                      {parsedNFePreview.cobranca?.duplicatas.map((dup, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs">
                          <span className="font-bold text-slate-700">Duplicata {dup.numero}</span>
                          <span className="text-slate-500 font-mono">Vencimento: {dup.vencimento}</span>
                          <span className="font-bold font-mono text-slate-900">
                            R$ {dup.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação Final */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedNFePreview(null);
                      setXmlText('');
                      setChaveAcessoInput('');
                    }}
                    className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  >
                    Descartar Conferência
                  </button>

                  <div className="flex gap-3 w-full sm:w-auto">
                    {modoEntradaNFe === 'CODIGO_BARRAS' ? (
                      <button
                        type="button"
                        id="btn-confirmar-entrada-nfe"
                        disabled={importandoXml}
                        onClick={handleImportarPorChaveAcesso}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition"
                      >
                        <Check className="w-4 h-4" />
                        {importandoXml ? 'Efetivando Entrada...' : 'Confirmar Entrada no Estoque & Gerar Contas a Pagar'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="btn-confirmar-entrada-nfe-xml"
                        disabled={importandoXml}
                        onClick={handleImportarXml}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition"
                      >
                        <Check className="w-4 h-4" />
                        {importandoXml ? 'Efetivando Entrada...' : 'Confirmar Entrada no Estoque & Gerar Contas a Pagar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
