// frontend/src/components/ImportadorNfeModal.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileCode2,
  UploadCloud,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ArrowRight,
  Calculator,
  Building2,
  FileCheck2,
  XCircle,
  Sparkles,
  RefreshCw,
  Layers,
  Search,
  Check,
  ChevronRight,
  BadgePercent,
  TrendingUp,
  Tag,
  DollarSign,
  Truck,
  ShieldAlert,
  Copy,
  Info,
  X,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';
import { Almoxarifado, LocalizacaoEstoque, SaldoEstoque } from '../../../backend/modules/estoque/estoque-types';
import { processarXmlNfe, efetivarEntradaEstoque, ProcessarXmlNfeResponse, EfetivarEntradaEstoqueResponse } from '../../../app/actions/fiscal-actions';

interface ImportadorNfeModalProps {
  empresaAtiva: Empresa;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  almoxarifados: Almoxarifado[];
  localizacoes?: LocalizacaoEstoque[];
  saldos?: SaldoEstoque[];
}

export interface ToastNotificacao {
  id: string;
  tipo: 'erro' | 'aviso' | 'sucesso' | 'info';
  titulo: string;
  mensagem: string;
  detalheTecnico?: string;
}

interface ItemEditavelState {
  numeroItem: number;
  codigoProdutoFornecedor: string;
  descricaoProdutoFornecedor: string;
  ncm: string;
  cfop: string;
  unidadeFornecedor: string;
  quantidadeFornecedor: number;
  valorUnitario: number;
  valorTotalBruto: number;
  valorFreteRateado: number;
  valorSeguroRateado: number;
  valorDesconto: number;
  valorOutrasDespesasRateado: number;
  valorIpi: number;
  valorIcms: number;
  valorIcmsSt: number;
  custoAquisicaoTotal: number;
  custoAquisicaoUnitario: number;
  loteNumero?: string;

  // De/Para & Destino
  itemInternoId: string;
  codigoItemInterno: string;
  descricaoItemInterno: string;
  unidadeMedidaInterna: string;
  fatorConversao: number;
  almoxarifadoDestinoId: string;
  localizacaoDestinoId?: string;
  mapeado: boolean;
  scoreConfianca: number;
}

let toastIdCounter = 0;
function gerarToastId() {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
}

export function ImportadorNfeModal({
  empresaAtiva,
  isOpen,
  onClose,
  onSuccess,
  almoxarifados,
  localizacoes = [],
  saldos = [],
}: ImportadorNfeModalProps) {
  const [etapa, setEtapa] = useState<'UPLOAD' | 'CONFERENCIA' | 'SUCESSO'>('UPLOAD');
  const [dragOver, setDragOver] = useState(false);
  const [chaveAcessoInput, setChaveAcessoInput] = useState('');
  const [processando, setProcessando] = useState(false);
  const [efetivando, setEfetivando] = useState(false);
  
  // Sistema de Toast de Notificações Graciosas
  const [toasts, setToasts] = useState<ToastNotificacao[]>([]);
  const [detalheExpandidoId, setDetalheExpandidoId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Dados da NF-e processada
  const [dadosNfe, setDadosNfe] = useState<ProcessarXmlNfeResponse | null>(null);
  const [itensEditaveis, setItensEditaveis] = useState<ItemEditavelState[]>([]);
  const [resultadoEfetivacao, setResultadoEfetivacao] = useState<EfetivarEntradaEstoqueResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Helper para adicionar Toast
  const adicionarToast = (toast: Omit<ToastNotificacao, 'id'>) => {
    const id = gerarToastId();
    const novoToast: ToastNotificacao = { ...toast, id };
    setToasts((prev) => [novoToast, ...prev.slice(0, 4)]); // Mantém no máximo 5 toasts ativos

    // Auto-dispensa após 7 segundos (exceto se for erro com detalhe longo, que dá 10s)
    const timeoutDuration = toast.tipo === 'erro' ? 9000 : 5000;
    setTimeout(() => {
      removerToast(id);
    }, timeoutDuration);
  };

  const removerToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const copiarDetalheTecnico = (id: string, texto: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2500);
    }
  };

  // Foco no campo de código de barras ao abrir
  useEffect(() => {
    if (isOpen && etapa === 'UPLOAD') {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, etapa]);

  if (!isOpen) return null;

  const defaultAlmoxId = almoxarifados.length > 0 ? almoxarifados[0].id : '';

  /**
   * Valida preliminarmente o texto do XML no cliente antes de enviar ao servidor
   */
  const validarArquivoXmlPreliminar = (nomeArquivo: string, conteudo: string): { valido: boolean; motivo?: string; detalhe?: string } => {
    if (!conteudo || conteudo.trim().length === 0) {
      return {
        valido: false,
        motivo: 'Arquivo vazio ou sem dados legíveis',
        detalhe: `O arquivo "${nomeArquivo}" tem tamanho de 0 bytes ou não contém caracteres decodificáveis em UTF-8/ASCII.`,
      };
    }

    const trimmed = conteudo.trim();

    // Verifica se parece um HTML ou mensagem de erro de servidor web
    if (trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<html') || trimmed.includes('<title>404') || trimmed.includes('<title>500')) {
      return {
        valido: false,
        motivo: 'Documento recebido é uma página HTML de erro e não um XML',
        detalhe: 'O arquivo parece conter uma página web HTML (ex: resposta de erro de proxy ou download incompleto da SEFAZ).',
      };
    }

    // Verifica se possui declaração ou tag XML mínima
    if (!trimmed.includes('<') || !trimmed.includes('>')) {
      return {
        valido: false,
        motivo: 'Arquivo não possui formatação XML válida',
        detalhe: 'Não foram encontrados marcadores de tags XML (< ... >) no arquivo selecionado.',
      };
    }

    // Verifica padrão SEFAZ NF-e (tags obrigatórias como <infNFe>, <NFe> ou <nfeProc>)
    const temNfeTag =
      trimmed.includes('<infNFe') ||
      trimmed.includes('<NFe') ||
      trimmed.includes('<nfeProc') ||
      trimmed.includes(':NFe') ||
      trimmed.includes(':infNFe');

    if (!temNfeTag) {
      return {
        valido: false,
        motivo: 'Estrutura XML fora do padrão SEFAZ NF-e (Layout 4.00)',
        detalhe:
          'O XML fornecido não contém as tags raiz esperadas de Nota Fiscal Eletrônica (<NFe>, <nfeProc> ou <infNFe>). Certifique-se de estar importando um XML de distribuição da NF-e (modelo 55/65).',
      };
    }

    // Verifica se possui nó de identificação da operação (<ide>) ou emitente (<emit>)
    const temIde = trimmed.includes('<ide') || trimmed.includes(':ide');
    const temEmit = trimmed.includes('<emit') || trimmed.includes(':emit');

    if (!temIde || !temEmit) {
      return {
        valido: false,
        motivo: 'Tags obrigatórias de cabeçalho fiscal ausentes',
        detalhe: 'O XML da NF-e está incompleto: os nós de identificação (<ide>) ou de dados do emitente (<emit>) não foram localizados.',
      };
    }

    return { valido: true };
  };

  // Manipulador de leitura de arquivo XML com tratamento de erros gracioso
  const handleFileRead = async (file: File) => {
    // 1. Validação de extensão de arquivo
    const nomeLower = file.name.toLowerCase();
    if (!nomeLower.endsWith('.xml') && file.type !== 'text/xml' && file.type !== 'application/xml') {
      adicionarToast({
        tipo: 'erro',
        titulo: 'Extensão de Arquivo Não Suportada',
        mensagem: `O arquivo "${file.name}" não é um documento .XML válido.`,
        detalheTecnico: 'O importador fiscal do GRUPO SENAGRO aceita estritamente arquivos com extensão .xml (padrão de intercâmbio SEFAZ v4.00). Documentos em PDF, TXT ou planilhas não podem ser processados por este módulo.',
      });
      return;
    }

    // 2. Validação de tamanho excessivo (> 10MB para um único XML é anormal)
    if (file.size > 10 * 1024 * 1024) {
      adicionarToast({
        tipo: 'erro',
        titulo: 'Arquivo Excessivamente Grande',
        mensagem: 'O arquivo XML selecionado ultrapassa o limite seguro de 10 MB.',
        detalheTecnico: `Tamanho detectado: ${(file.size / (1024 * 1024)).toFixed(2)} MB. Arquivos de NF-e individuais geralmente possuem entre 10 KB e 500 KB.`,
      });
      return;
    }

    setProcessando(true);

    try {
      const text = await file.text();

      // 3. Validação preliminar do padrão SEFAZ
      const validacao = validarArquivoXmlPreliminar(file.name, text);
      if (!validacao.valido) {
        adicionarToast({
          tipo: 'erro',
          titulo: validacao.motivo || 'XML Inválido',
          mensagem: `Não foi possível processar o arquivo "${file.name}".`,
          detalheTecnico: validacao.detalhe,
        });
        setProcessando(false);
        return;
      }

      // 4. Execução da Server Action com parsing e cruzamento fiscal
      const res = await processarXmlNfe(empresaAtiva.id, text, 'u-operador-almoxarifado');

      if (!res.success || !res.nfeParsed) {
        adicionarToast({
          tipo: 'erro',
          titulo: 'Falha no Parsing Fiscal SEFAZ',
          mensagem: res.mensagem || 'Ocorreu um erro ao interpretar a estrutura tributária da NF-e.',
          detalheTecnico: res.error || 'Verifique se o XML possui a tag <protNFe> ou protocolo de autorização de uso emitido pela SEFAZ.',
        });
        setProcessando(false);
        return;
      }

      setDadosNfe(res);

      // Prepara lista de itens editáveis para conferência
      const itensMapeados: ItemEditavelState[] = (res.itensCruzados || []).map((it) => {
        return {
          numeroItem: it.numeroItem,
          codigoProdutoFornecedor: it.codigoProdutoFornecedor,
          descricaoProdutoFornecedor: it.descricaoProdutoFornecedor,
          ncm: it.ncm,
          cfop: it.cfop,
          unidadeFornecedor: it.unidadeFornecedor,
          quantidadeFornecedor: it.quantidadeFornecedor,
          valorUnitario: it.valorUnitario,
          valorTotalBruto: it.valorTotalBruto,
          valorFreteRateado: it.valorFreteRateado,
          valorSeguroRateado: it.valorSeguroRateado,
          valorDesconto: it.valorDesconto,
          valorOutrasDespesasRateado: it.valorOutrasDespesasRateado,
          valorIpi: it.valorIpi,
          valorIcms: it.valorIcms,
          valorIcmsSt: it.valorIcmsSt,
          custoAquisicaoTotal: it.custoAquisicaoTotal,
          custoAquisicaoUnitario: it.custoAquisicaoUnitario,
          loteNumero: it.loteNumero || `LOTE-NF${res.nfeParsed?.numeroDocumento}-${it.numeroItem}`,

          itemInternoId: it.itemInternoId || `prod-${it.codigoProdutoFornecedor.toLowerCase()}`,
          codigoItemInterno: it.codigoItemInterno || it.codigoProdutoFornecedor,
          descricaoItemInterno: it.descricaoItemInterno || it.descricaoProdutoFornecedor,
          unidadeMedidaInterna: it.unidadeMedidaInterna || it.unidadeFornecedor,
          fatorConversao: it.fatorConversao || 1,
          almoxarifadoDestinoId: defaultAlmoxId,
          localizacaoDestinoId: localizacoes.length > 0 ? localizacoes[0].id : undefined,
          mapeado: it.mapeado,
          scoreConfianca: it.scoreConfianca,
        };
      });

      setItensEditaveis(itensMapeados);
      setEtapa('CONFERENCIA');

      adicionarToast({
        tipo: 'sucesso',
        titulo: 'NF-e Carregada com Sucesso',
        mensagem: `NF-e nº ${res.nfeParsed.numeroDocumento} de ${res.nfeParsed.emitente.razaoSocialNome} processada (${itensMapeados.length} itens).`,
      });
    } catch (err: unknown) {
      const mensagemErro = err instanceof Error ? err.message : String(err);
      adicionarToast({
        tipo: 'erro',
        titulo: 'Erro Crítico no Processamento do XML',
        mensagem: 'Não foi possível ler o arquivo XML selecionado.',
        detalheTecnico: `Detalhe da exceção: ${mensagemErro}`,
      });
    } finally {
      setProcessando(false);
    }
  };

  // Simulação / Busca por Chave de Acesso (44 dígitos) com validações
  const handleConsultarChaveAcesso = async () => {
    const chaveLimpa = chaveAcessoInput.replace(/\D/g, '');
    
    if (chaveLimpa.length === 0) {
      adicionarToast({
        tipo: 'aviso',
        titulo: 'Chave de Acesso Vazia',
        mensagem: 'Por favor, informe ou bipe a chave de acesso de 44 dígitos da NF-e.',
      });
      return;
    }

    if (chaveLimpa.length !== 44) {
      adicionarToast({
        tipo: 'aviso',
        titulo: 'Chave de Acesso Incompleta',
        mensagem: `A chave informada possui ${chaveLimpa.length} dígitos (o padrão SEFAZ exige exatamente 44 dígitos).`,
        detalheTecnico: `Chave capturada: "${chaveLimpa}". Formato esperado: [UF:2][AAMM:4][CNPJ:14][MOD:2][SER:3][NUM:9][TPEMI:1][COD:8][DV:1].`,
      });
      return;
    }

    setProcessando(true);

    // Gera um XML SEFAZ válido representativo da chave informada para teste
    const xmlMock = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${chaveLimpa}" versao="4.00">
      <ide>
        <cUF>31</cUF>
        <cNF>${chaveLimpa.substring(35, 43)}</cNF>
        <natOp>COMPRA DE MATERIA-PRIMA INDUSTRIAL</natOp>
        <mod>55</mod>
        <serie>${chaveLimpa.substring(22, 25)}</serie>
        <nNF>${parseInt(chaveLimpa.substring(25, 34), 10)}</nNF>
        <dhEmi>${new Date().toISOString()}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
      </ide>
      <emit>
        <CNPJ>60870004000140</CNPJ>
        <xNome>USINAS SIDERURGICAS DE MINAS GERAIS S/A. USIMINAS</xNome>
        <xFant>USIMINAS</xFant>
        <IE>0623148870012</IE>
        <enderEmit>
          <xLgr>AV DO CONTORNO</xLgr>
          <nro>3300</nro>
          <xBairro>FUNCIONARIOS</xBairro>
          <xMun>BELO HORIZONTE</xMun>
          <UF>MG</UF>
          <CEP>30110017</CEP>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>${empresaAtiva.cnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${empresaAtiva.razaoSocial}</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>CH-1020-475</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>CHAPA LAMINADA QUENTE SAE 1020 4.75 X 1500 X 3000</xProd>
          <NCM>72083890</NCM>
          <CFOP>5101</CFOP>
          <uCom>PC</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>1250.0000</vUnCom>
          <vProd>12500.00</vProd>
          <vFrete>450.00</vFrete>
          <vSeg>50.00</vSeg>
          <vDesc>200.00</vDesc>
          <rastro>
            <nLote>CORRIDA-USI-8842</nLote>
            <qLote>10.0000</qLote>
            <dFab>2026-08-01</dFab>
          </rastro>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>12800.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>2304.00</vICMS>
            </ICMS00>
          </ICMS>
          <IPI>
            <IPITrib>
              <CST>50</CST>
              <vBC>12500.00</vBC>
              <pIPI>5.00</pIPI>
              <vIPI>625.00</vIPI>
            </IPITrib>
          </IPI>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>CHAPA-A36-12.7MM</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>CHAPA DE ACO ESTRUTURAL ASTM A36 - 12.70MM X 2440MM X 6000MM</xProd>
          <NCM>72085100</NCM>
          <CFOP>5101</CFOP>
          <uCom>KG</uCom>
          <qCom>5.0000</qCom>
          <vUnCom>3400.0000</vUnCom>
          <vProd>17000.00</vProd>
          <vFrete>600.00</vFrete>
          <vSeg>80.00</vSeg>
          <vDesc>0.00</vDesc>
          <rastro>
            <nLote>CORRIDA-USI-9921</nLote>
            <qLote>5.0000</qLote>
          </rastro>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>17680.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>3182.40</vICMS>
            </ICMS00>
          </ICMS>
          <IPI>
            <IPITrib>
              <CST>50</CST>
              <vBC>17000.00</vBC>
              <pIPI>5.00</pIPI>
              <vIPI>850.00</vIPI>
            </IPITrib>
          </IPI>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>30480.00</vBC>
          <vICMS>5486.40</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vProd>29500.00</vProd>
          <vFrete>1050.00</vFrete>
          <vSeg>130.00</vSeg>
          <vDesc>200.00</vDesc>
          <vII>0.00</vII>
          <vIPI>1475.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>486.75</vPIS>
          <vCOFINS>2242.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>31955.00</vNF>
        </ICMSTot>
      </total>
      <protNFe>
        <infProt>
          <nProt>131260098765432</nProt>
          <dhRecbto>${new Date().toISOString()}</dhRecbto>
          <cStat>100</cStat>
          <xMotivo>Autorizado o uso da NF-e</xMotivo>
        </infProt>
      </protNFe>
    </infNFe>
  </NFe>
</nfeProc>`;

    try {
      const res = await processarXmlNfe(empresaAtiva.id, xmlMock, 'u-operador-almoxarifado');
      if (!res.success || !res.nfeParsed) {
        adicionarToast({
          tipo: 'erro',
          titulo: 'Chave Não Localizada ou Inválida',
          mensagem: res.mensagem || 'Falha ao recuperar os dados da NF-e via chave de acesso.',
          detalheTecnico: res.error,
        });
        setProcessando(false);
        return;
      }

      setDadosNfe(res);

      const itensMapeados: ItemEditavelState[] = (res.itensCruzados || []).map((it) => ({
        numeroItem: it.numeroItem,
        codigoProdutoFornecedor: it.codigoProdutoFornecedor,
        descricaoProdutoFornecedor: it.descricaoProdutoFornecedor,
        ncm: it.ncm,
        cfop: it.cfop,
        unidadeFornecedor: it.unidadeFornecedor,
        quantidadeFornecedor: it.quantidadeFornecedor,
        valorUnitario: it.valorUnitario,
        valorTotalBruto: it.valorTotalBruto,
        valorFreteRateado: it.valorFreteRateado,
        valorSeguroRateado: it.valorSeguroRateado,
        valorDesconto: it.valorDesconto,
        valorOutrasDespesasRateado: it.valorOutrasDespesasRateado,
        valorIpi: it.valorIpi,
        valorIcms: it.valorIcms,
        valorIcmsSt: it.valorIcmsSt,
        custoAquisicaoTotal: it.custoAquisicaoTotal,
        custoAquisicaoUnitario: it.custoAquisicaoUnitario,
        loteNumero: it.loteNumero || `LOTE-NF${res.nfeParsed?.numeroDocumento}-${it.numeroItem}`,
        itemInternoId: it.itemInternoId || `prod-${it.codigoProdutoFornecedor.toLowerCase()}`,
        codigoItemInterno: it.codigoItemInterno || it.codigoProdutoFornecedor,
        descricaoItemInterno: it.descricaoItemInterno || it.descricaoProdutoFornecedor,
        unidadeMedidaInterna: it.unidadeMedidaInterna || it.unidadeFornecedor,
        fatorConversao: it.fatorConversao || 1,
        almoxarifadoDestinoId: defaultAlmoxId,
        localizacaoDestinoId: localizacoes.length > 0 ? localizacoes[0].id : undefined,
        mapeado: it.mapeado,
        scoreConfianca: it.scoreConfianca,
      }));

      setItensEditaveis(itensMapeados);
      setEtapa('CONFERENCIA');

      adicionarToast({
        tipo: 'sucesso',
        titulo: 'Consulta de Chave Concluída',
        mensagem: `NF-e nº ${res.nfeParsed.numeroDocumento} identificada com sucesso (${itensMapeados.length} itens).`,
      });
    } catch (err: unknown) {
      const mensagemErro = err instanceof Error ? err.message : String(err);
      adicionarToast({
        tipo: 'erro',
        titulo: 'Erro ao Consultar Chave de Acesso',
        mensagem: 'Ocorreu uma falha na consulta SEFAZ da chave informada.',
        detalheTecnico: mensagemErro,
      });
    } finally {
      setProcessando(false);
    }
  };

  // Carregar XML de Demonstração Rápido
  const handleCarregarExemplo = (tipo: 'ACO' | 'PERFIS') => {
    const chaveExemplo =
      tipo === 'ACO'
        ? '31260860870004000140550010000458921982736415'
        : '31260801571528000180550010000782141584920193';
    setChaveAcessoInput(chaveExemplo);
    setTimeout(() => {
      handleConsultarChaveAcesso();
    }, 50);
  };

  // Atualiza campo de um item específico na tela de conferência com tipagem segura
  const handleAtualizarItem = <K extends keyof ItemEditavelState>(
    idx: number,
    campo: K,
    valor: ItemEditavelState[K]
  ) => {
    setItensEditaveis((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [campo]: valor };

      // Se alterou o código do item interno, tenta vincular com a descrição e ID do estoque
      if (campo === 'codigoItemInterno') {
        const codigoBuscado = String(valor).toLowerCase();
        const achou = saldos.find((s) => s.codigoProduto.toLowerCase() === codigoBuscado);
        if (achou) {
          copy[idx].itemInternoId = achou.produtoId;
          copy[idx].descricaoItemInterno = achou.descricaoProduto;
          copy[idx].unidadeMedidaInterna = achou.unidadeMedida;
          copy[idx].mapeado = true;
        }
      }

      return copy;
    });
  };

  // Efetiva a Entrada no Estoque
  const handleEfetivarEntrada = async () => {
    if (!dadosNfe?.nfeParsed) return;

    setEfetivando(true);

    try {
      const payload = {
        empresaId: empresaAtiva.id,
        usuarioId: 'u-operador-almoxarifado',
        usuarioNome: 'Operador de Almoxarifado / Fiscal',
        chaveAcesso: dadosNfe.nfeParsed.chaveAcesso,
        numeroDocumento: String(dadosNfe.nfeParsed.numeroDocumento),
        serie: String(dadosNfe.nfeParsed.serie || '1'),
        cnpjEmissor: dadosNfe.nfeParsed.emitente.cnpjCpf,
        razaoSocialEmissor: dadosNfe.nfeParsed.emitente.razaoSocialNome,
        inscricaoEstadualEmissor: dadosNfe.nfeParsed.emitente.inscricaoEstadual,
        dataEmissao: dadosNfe.nfeParsed.dataHoraEmissao,
        naturezaOperacao: dadosNfe.nfeParsed.naturezaOperacao,
        protocoloAutorizacao: dadosNfe.nfeParsed.protocoloAutorizacao,
        valorTotal: dadosNfe.totais?.valorTotalNota || dadosNfe.nfeParsed.totais.valorTotalNota,
        valorProdutos: dadosNfe.totais?.valorProdutos || dadosNfe.nfeParsed.totais.valorProdutos,
        valorFrete: dadosNfe.totais?.valorFrete || dadosNfe.nfeParsed.totais.valorFrete,
        valorSeguro: dadosNfe.totais?.valorSeguro || dadosNfe.nfeParsed.totais.valorSeguro,
        valorDesconto: dadosNfe.totais?.valorDesconto || dadosNfe.nfeParsed.totais.valorDesconto,
        valorIpi: dadosNfe.totais?.valorIpi || dadosNfe.nfeParsed.totais.valorIpi,
        valorIcmsSt: dadosNfe.totais?.valorIcmsSt || dadosNfe.nfeParsed.totais.valorIcmsSt,
        itens: itensEditaveis.map((it) => ({
          numeroItem: it.numeroItem,
          codigoProdutoFornecedor: it.codigoProdutoFornecedor,
          descricaoProdutoFornecedor: it.descricaoProdutoFornecedor,
          ncm: it.ncm,
          cfop: it.cfop,
          unidadeMedidaFornecedor: it.unidadeFornecedor,
          quantidade: it.quantidadeFornecedor,
          valorUnitario: it.valorUnitario,
          valorTotalBruto: it.valorTotalBruto,
          valorFreteRateado: it.valorFreteRateado,
          valorSeguroRateado: it.valorSeguroRateado,
          valorDesconto: it.valorDesconto,
          valorOutrasDespesasRateado: it.valorOutrasDespesasRateado,
          valorIpi: it.valorIpi,
          valorIcms: it.valorIcms,
          valorIcmsSt: it.valorIcmsSt,
          custoAquisicaoUnitario: it.custoAquisicaoUnitario,
          custoAquisicaoTotal: it.custoAquisicaoTotal,
          numeroLote: it.loteNumero,
          itemInternoId: it.itemInternoId,
          codigoItemInterno: it.codigoItemInterno,
          descricaoItemInterno: it.descricaoItemInterno,
          unidadeMedidaInterna: it.unidadeMedidaInterna,
          fatorConversao: it.fatorConversao,
          almoxarifadoDestinoId: it.almoxarifadoDestinoId,
          localizacaoDestinoId: it.localizacaoDestinoId,
        })),
        salvarRegrasDePara: true,
      };

      const res = await efetivarEntradaEstoque(payload);

      if (!res.success) {
        adicionarToast({
          tipo: 'erro',
          titulo: 'Falha ao Efetivar Entrada de Estoque',
          mensagem: res.mensagem || 'Não foi possível gravar os movimentos de entrada.',
          detalheTecnico: 'O ledger de estoque abortou a transação multiempresa para evitar inconsistências.',
        });
        setEfetivando(false);
        return;
      }

      setResultadoEfetivacao(res);
      setEtapa('SUCESSO');
      adicionarToast({
        tipo: 'sucesso',
        titulo: 'Entrada Fiscal Concluída',
        mensagem: `Estoque atualizado e ${res.produtosRecalculados.length} produtos com custo médio recalculado.`,
      });
      onSuccess();
    } catch (err: unknown) {
      const mensagemErro = err instanceof Error ? err.message : String(err);
      adicionarToast({
        tipo: 'erro',
        titulo: 'Erro ao Gravar Movimentações Fiscais',
        mensagem: 'Ocorreu uma exceção inesperada durante a efetivação no estoque.',
        detalheTecnico: mensagemErro,
      });
    } finally {
      setEfetivando(false);
    }
  };

  // Totalizadores calculados do Preview
  const totalItens = itensEditaveis.length;
  const totalQtdFisica = itensEditaveis.reduce((acc, it) => acc + it.quantidadeFornecedor * (it.fatorConversao || 1), 0);
  const totalCustoAquisicao = itensEditaveis.reduce((acc, it) => acc + it.custoAquisicaoTotal, 0);

  return (
    <div
      id="modal-importador-nfe"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
    >
      {/* ========================================================================= */}
      {/* SISTEMA DE TOASTS FLUTUANTES DE ALERTA E ERROS GRACIOSOS                  */}
      {/* ========================================================================= */}
      <div className="fixed top-5 right-5 z-60 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const isExpandido = detalheExpandidoId === toast.id;
          const foiCopiado = copiadoId === toast.id;

          const estilo =
            toast.tipo === 'erro'
              ? 'bg-rose-950/95 border-rose-600 text-rose-50'
              : toast.tipo === 'aviso'
              ? 'bg-amber-950/95 border-amber-500 text-amber-50'
              : toast.tipo === 'sucesso'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-50'
              : 'bg-slate-900/95 border-blue-500 text-blue-50';

          const icone =
            toast.tipo === 'erro' ? (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : toast.tipo === 'aviso' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : toast.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            );

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-200 animate-in slide-in-from-top-4 fade-in ${estilo}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {icone}
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs leading-tight tracking-wide">{toast.titulo}</h5>
                    <p className="text-xs text-slate-200 leading-relaxed opacity-90">{toast.mensagem}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removerToast(toast.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                  title="Fechar notificação"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Detalhe Técnico Expansível (Útil para suporte fiscal/auditoria) */}
              {toast.detalheTecnico && (
                <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px]">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDetalheExpandidoId(isExpandido ? null : toast.id)}
                      className="text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 flex items-center gap-1"
                    >
                      {isExpandido ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos do erro'}
                    </button>
                    {isExpandido && (
                      <button
                        type="button"
                        onClick={() => copiarDetalheTecnico(toast.id, toast.detalheTecnico || '')}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        {foiCopiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    )}
                  </div>

                  {isExpandido && (
                    <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[10px] leading-normal text-slate-300 break-words max-h-32 overflow-y-auto">
                      {toast.detalheTecnico}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Importador de NF-e Inbound & Rateio de Estoque</h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                  {empresaAtiva.codigo}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Parsing inteligente de XML (SEFAZ v4.00), Auto-Cadastro de Fornecedores, De/Para e Recálculo de Custo Médio.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Indicador de Passos */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 ${
                etapa === 'UPLOAD' ? 'text-blue-700 font-bold' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  etapa === 'UPLOAD' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                1
              </div>
              <span>Upload / Leitura do XML</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400" />

            <div
              className={`flex items-center gap-2 ${
                etapa === 'CONFERENCIA' ? 'text-blue-700 font-bold' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  etapa === 'CONFERENCIA' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                2
              </div>
              <span>Preview de Rateio & De/Para</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400" />

            <div
              className={`flex items-center gap-2 ${
                etapa === 'SUCESSO' ? 'text-emerald-700 font-bold' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  etapa === 'SUCESSO' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                3
              </div>
              <span>Entrada Efetivada</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {empresaAtiva.razaoSocial} • CNPJ: {empresaAtiva.cnpj}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* ETAPA 1: ÁREA DE UPLOAD E LEITURA DE CÓDIGO DE BARRAS                    */}
        {/* ========================================================================= */}
        {etapa === 'UPLOAD' && (
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Grid 2 Colunas: Drag & Drop + Leitor Óptico */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna 1: Drag & Drop XML (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    1. Arrastar Arquivo XML da NF-e (Inbound)
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Faça o upload do XML distribuído pela SEFAZ ou fornecedor para decomposição tributária automática.
                  </p>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileRead(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                      dragOver
                        ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xml,text/xml,application/xml"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileRead(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                      {processando ? (
                        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
                      ) : (
                        <FileCode2 className="w-7 h-7" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      {processando ? 'Processando e Cruzando Catálogo...' : 'Arraste o arquivo .XML da NF-e aqui'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">ou clique para selecionar do seu computador</span>
                    <div className="mt-3 px-3 py-1 bg-slate-100 rounded-full text-[11px] text-slate-600 font-mono">
                      Suporta layout SEFAZ NF-e 4.00 (procNFe / NFe)
                    </div>
                  </div>
                </div>

                {/* Atalhos para Teste / Demonstração Rápida */}
                <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-slate-700 block">Deseja simular uma entrada real?</span>
                    <span className="text-slate-500 text-[11px]">Selecione um lote de demonstração com rateio de frete e IPI:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() => handleCarregarExemplo('ACO')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      USIMINAS (Chapas)
                    </button>
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() => handleCarregarExemplo('PERFIS')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      GERDAU (Estrutural)
                    </button>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Leitor Óptico / Chave 44 Dígitos (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-indigo-600" />
                    2. Leitor Óptico / Chave de Acesso (44 Dígitos)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Aponte o leitor de código de barras para o DANFE impresso ou digite a chave de 44 posições.
                  </p>

                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Chave de Acesso da NF-e:
                    </label>
                    <div className="relative">
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        maxLength={44}
                        value={chaveAcessoInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setChaveAcessoInput(val);
                          // Auto-dispara quando atinge 44 dígitos (comportamento típico de leitor de código de barras)
                          if (val.length === 44) {
                            setTimeout(() => handleConsultarChaveAcesso(), 100);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && chaveAcessoInput.length === 44) {
                            handleConsultarChaveAcesso();
                          }
                        }}
                        placeholder="Ex: 31260860870004000140550010000458921982736415"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-mono font-bold text-slate-400">
                        {chaveAcessoInput.length}/44
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={processando || chaveAcessoInput.length !== 44}
                      onClick={handleConsultarChaveAcesso}
                      className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processando ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Barcode className="w-4 h-4" />
                      )}
                      Consultar & Importar Chave
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 space-y-1">
                  <span className="font-bold block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Automação Integrada:
                  </span>
                  <span>
                    Ao carregar o documento, o sistema automaticamente verifica se o fornecedor já possui cadastro na empresa ativa e cruza os códigos <code>cProd</code> com a tabela <code>De/Para</code>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: PREVIEW DE RATEIO, DE/PARA E DESTINO DE ALMOXARIFADO             */}
        {/* ========================================================================= */}
        {etapa === 'CONFERENCIA' && dadosNfe && (
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Cartão de Resumo do Cabeçalho da NF-e */}
            <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-bold">
                    NF-e nº {dadosNfe.nfeParsed?.numeroDocumento} • Série {dadosNfe.nfeParsed?.serie}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Emissão: {new Date(dadosNfe.nfeParsed?.dataHoraEmissao || '').toLocaleDateString('pt-BR')}
                  </span>
                  {dadosNfe.fornecedorCadastradoAgora ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                      Novo Fornecedor Cadastrado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px]">
                      Fornecedor Identificado
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  {dadosNfe.fornecedor?.razaoSocial || dadosNfe.nfeParsed?.emitente.razaoSocialNome}
                </h3>
                <div className="text-xs text-slate-400 font-mono">
                  CNPJ: {dadosNfe.nfeParsed?.emitente.cnpjCpf} • Chave: {dadosNfe.nfeParsed?.chaveAcesso}
                </div>
              </div>

              {/* Totais Fiscais da Nota */}
              <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Valor Produtos</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {dadosNfe.totais?.valorProdutos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="h-7 w-px bg-slate-700" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Frete + IPI + ST</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {((dadosNfe.totais?.valorFrete || 0) + (dadosNfe.totais?.valorIpi || 0) + (dadosNfe.totais?.valorIcmsSt || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="h-7 w-px bg-slate-700" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Valor Total NF-e</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {dadosNfe.totais?.valorTotalNota.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabela de Itens com Rateio e De/Para */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  Itens da Nota Fiscal & Rateio de Custo de Aquisição ({itensEditaveis.length} Itens)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Verifique o vínculo De/Para com o catálogo interno e o almoxarifado de destino.
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto max-h-[360px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5 min-w-[180px]">Item do Fornecedor (XML)</th>
                        <th className="p-2.5 min-w-[200px]">Item Interno (De/Para)</th>
                        <th className="p-2.5 text-right w-24">Qtd XML</th>
                        <th className="p-2.5 text-right w-24">Valor Unit (R$)</th>
                        <th className="p-2.5 text-right w-28">Rateio Encargos</th>
                        <th className="p-2.5 text-right min-w-[130px] bg-emerald-50 text-emerald-900">
                          Custo Aquisição Final
                        </th>
                        <th className="p-2.5 min-w-[160px]">Almoxarifado Destino</th>
                        <th className="p-2.5 min-w-[120px]">Nº Lote Rastreio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {itensEditaveis.map((item, idx) => {
                        const encargos =
                          (item.valorFreteRateado || 0) +
                          (item.valorSeguroRateado || 0) +
                          (item.valorOutrasDespesasRateado || 0) +
                          (item.valorIpi || 0) +
                          (item.valorIcmsSt || 0) -
                          (item.valorDesconto || 0);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-2.5 text-center font-bold text-slate-500">{item.numeroItem}</td>
                            
                            {/* Dados do Fornecedor */}
                            <td className="p-2.5">
                              <span className="font-bold text-slate-900 block font-mono text-[11px]">
                                {item.codigoProdutoFornecedor}
                              </span>
                              <span className="text-slate-600 text-[11px] line-clamp-1" title={item.descricaoProdutoFornecedor}>
                                {item.descricaoProdutoFornecedor}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                NCM: {item.ncm} • CFOP: {item.cfop}
                              </span>
                            </td>

                            {/* Cruzamento De/Para */}
                            <td className="p-2.5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={item.codigoItemInterno}
                                    onChange={(e) => handleAtualizarItem(idx, 'codigoItemInterno', e.target.value)}
                                    placeholder="Código Interno"
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-blue-900 bg-white"
                                  />
                                  {item.mapeado ? (
                                    <span
                                      className="p-1 rounded bg-emerald-100 text-emerald-800 shrink-0"
                                      title="Item vinculado com o catálogo interno"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </span>
                                  ) : (
                                    <span
                                      className="p-1 rounded bg-amber-100 text-amber-800 shrink-0 text-[10px] font-bold"
                                      title="Novo item para cadastro ou mapeamento manual"
                                    >
                                      Novo
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={item.descricaoItemInterno}
                                  onChange={(e) => handleAtualizarItem(idx, 'descricaoItemInterno', e.target.value)}
                                  placeholder="Descrição interna do produto"
                                  className="w-full border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-600 bg-slate-50"
                                />
                              </div>
                            </td>

                            {/* Quantidade */}
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {item.quantidadeFornecedor} {item.unidadeFornecedor}
                            </td>

                            {/* Valor Unitário */}
                            <td className="p-2.5 text-right font-mono text-slate-700">
                              {item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>

                            {/* Rateio */}
                            <td className="p-2.5 text-right font-mono text-xs">
                              <span className="text-amber-800 font-bold block">
                                +{encargos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Frete: {item.valorFreteRateado.toFixed(2)} | IPI: {item.valorIpi.toFixed(2)}
                              </span>
                            </td>

                            {/* Custo de Aquisição Final Recalculado */}
                            <td className="p-2.5 text-right font-mono bg-emerald-50/60 border-x border-emerald-100">
                              <span className="font-bold text-emerald-800 block text-xs">
                                {item.custoAquisicaoUnitario.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                                <span className="text-[10px] text-slate-500 font-normal"> /un</span>
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold">
                                Total: {item.custoAquisicaoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </td>

                            {/* Seletor de Almoxarifado Destino */}
                            <td className="p-2.5">
                              <select
                                value={item.almoxarifadoDestinoId}
                                onChange={(e) => handleAtualizarItem(idx, 'almoxarifadoDestinoId', e.target.value)}
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 font-medium"
                              >
                                {almoxarifados.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.codigo} - {a.nome}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Lote */}
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.loteNumero || ''}
                                onChange={(e) => handleAtualizarItem(idx, 'loteNumero', e.target.value)}
                                placeholder="Nº Lote"
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-800"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Painel Inferior de Resumo de Custo Médio e Ações */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>Total Itens: <strong className="text-slate-900">{totalItens}</strong></span>
                </div>
                <div className="h-4 w-px bg-slate-300" />
                <div className="text-slate-600">
                  Qtd Total a Adicionar: <strong className="text-slate-900 font-mono">{totalQtdFisica} UN/KG</strong>
                </div>
                <div className="h-4 w-px bg-slate-300" />
                <div className="text-slate-600">
                  Custo Total a Incorporar: <strong className="text-emerald-700 font-mono font-bold">{totalCustoAquisicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setEtapa('UPLOAD')}
                  disabled={efetivando}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleEfetivarEntrada}
                  disabled={efetivando}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                >
                  {efetivando ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {efetivando ? 'Efetivando e Recalculando...' : 'Efetivar Entrada no Estoque'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 3: CONFIRMAÇÃO DE SUCESSO & RECÁLCULO DE CUSTO MÉDIO                 */}
        {/* ========================================================================= */}
        {etapa === 'SUCESSO' && resultadoEfetivacao && (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Entrada de Estoque Concluída com Sucesso!</h3>
              <p className="text-xs text-emerald-700 max-w-xl mx-auto">
                {resultadoEfetivacao.mensagem}
              </p>
            </div>

            {/* Tabela de Produtos com Recálculo de Custo Médio Unitário Ponderado */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Demonstrativo de Recálculo do Custo Médio Unitário Ponderado
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Código / Produto</th>
                      <th className="p-2.5 text-right">Saldo Anterior</th>
                      <th className="p-2.5 text-right">Custo Médio Anterior</th>
                      <th className="p-2.5 text-right bg-blue-50 text-blue-900">+ Qtd Entrada</th>
                      <th className="p-2.5 text-right bg-blue-50 text-blue-900">Custo Entrada Unit</th>
                      <th className="p-2.5 text-right bg-emerald-50 text-emerald-900 font-bold">Novo Saldo Total</th>
                      <th className="p-2.5 text-right bg-emerald-50 text-emerald-900 font-bold">Novo Custo Médio Unit</th>
                      <th className="p-2.5 text-right bg-emerald-50 text-emerald-900 font-bold">Valor Total Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {resultadoEfetivacao.produtosRecalculados.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <strong className="font-mono text-slate-900 block">{p.codigoProduto}</strong>
                          <span className="text-slate-500 text-[11px]">{p.descricaoProduto}</span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">{p.saldoAnteriorQtd}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          {p.custoMedioAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-blue-700 bg-blue-50/50">
                          +{p.quantidadeAdicionada}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-blue-700 bg-blue-50/50">
                          {p.custoEntradaUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/50">
                          {p.novoSaldoQtd}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/50">
                          {p.novoCustoMedioUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-900 bg-emerald-50/50">
                          {p.novoCustoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detalhes de Integração Financeira */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-700">
                  Integração Financeira: <strong>{resultadoEfetivacao.titulosFinanceirosIds.length} Título(s) de Contas a Pagar gerado(s).</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

  